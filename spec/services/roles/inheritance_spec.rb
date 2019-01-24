require 'rails_helper'

RSpec.describe Roles::Inheritance, type: :service do
  let!(:collection) { create(:collection, num_cards: 5) }
  let!(:subcollection_card) do
    create(:collection_card_collection, parent: collection)
  end
  let(:subcollection) { subcollection_card.collection }
  let(:inheritance) do
    Roles::Inheritance.new(collection)
  end
  let(:all_objects) do
    [collection] + collection.children
  end
  let(:editors) { create_list(:user, 2) }
  let(:viewers) { create_list(:user, 2) }
  let(:item) { collection.items.first }

  describe '#inherit_from_parent?' do
    context 'same editors and viewers on all items' do
      before do
        all_objects.each(&:unanchor_and_inherit_roles_from_anchor!)
        add_roles(Role::EDITOR, editors, all_objects)
        add_roles(Role::VIEWER, viewers, all_objects)
      end

      it 'returns true for all children' do
        expect(collection.children.all? { |item| inheritance.inherit_from_parent?(item) == true }).to be true
      end
    end

    context 'child has more roles than parent, but includes all parent roles' do
      before do
        add_roles(Role::EDITOR, editors, all_objects)
        add_roles(Role::VIEWER, viewers, item)
      end

      it 'returns true' do
        expect(inheritance.inherit_from_parent?(item)).to be true
      end
    end

    context 'less users on child, but same role as parent' do
      before do
        add_roles(Role::EDITOR, editors, collection)
        add_roles(Role::EDITOR, editors[0], item)
      end

      it 'returns false' do
        expect(inheritance.inherit_from_parent?(item)).to be false
      end
    end

    context 'same users, lesser role' do
      before do
        add_roles(Role::EDITOR, editors, collection)
        add_roles(Role::VIEWER, editors, item)
      end

      it 'returns false' do
        expect(inheritance.inherit_from_parent?(item)).to be false
      end
    end

    context 'same users, higher role' do
      before do
        add_roles(Role::VIEWER, editors, collection)
        add_roles(Role::EDITOR, editors, item)
      end

      it 'returns true' do
        expect(inheritance.inherit_from_parent?(item)).to be true
      end
    end

    context 'different users, different roles' do
      before do
        add_roles(Role::EDITOR, editors, collection)
        add_roles(Role::VIEWER, viewers, item)
      end

      it 'returns false' do
        expect(inheritance.inherit_from_parent?(item)).to be false
      end
    end

    context 'parent has more roles than children' do
      before do
        add_roles(Role::EDITOR, editors, all_objects)
        add_roles(Role::VIEWER, viewers, collection)
      end

      it 'returns false' do
        expect(inheritance.inherit_from_parent?(item)).to be false
      end
    end

    context 'when removing roles, passing in potential removed users and groups' do
      let(:addtl_viewer) { create(:user) }

      context 'where role exists on parent' do
        before do
          addtl_viewer.add_role(Role::VIEWER, collection)
          addtl_viewer.add_role(Role::VIEWER, item)
        end

        it 'should return false to indicate breaking inheritance' do
          expect(
            inheritance.inherit_from_parent?(item, remove_identifiers: ["User_#{addtl_viewer.id}"]),
          ).to be false
        end
      end

      context 'where role does not exist on parent' do
        before do
          addtl_viewer.add_role(Role::VIEWER, item)
        end

        it 'should return true to indicate matching inheritance' do
          expect(
            inheritance.inherit_from_parent?(item, remove_identifiers: ["User_#{addtl_viewer.id}"]),
          ).to be true
        end
      end
    end
  end

  # private_child? is generally just doing !inherit_from_parent so we don't need to
  # duplicate everything above
  describe '#private_child?' do
    before do
      add_roles(Role::EDITOR, editors, collection)
      add_roles(Role::EDITOR, editors[0], item)
    end

    it 'returns true when child has less editors than parent' do
      expect(inheritance.private_child?(item)).to be true
    end

    context 'cached_inheritance' do
      it 'caches the inheritance settings on the item' do
        expect(item.cached_inheritance).to be nil
        expect(inheritance.private_child?(item)).to be true
        # now the setting should be cached
        expect(item.cached_inheritance['private']).to be true
      end

      it 'will re-cache the settings on the item if item is reanchored' do
        expect(inheritance.private_child?(item)).to be true
        # now the setting should be cached
        expect(item.cached_inheritance['private']).to be true
        item.reanchor!
        expect(item.reload.cached_inheritance['private']).to be false
      end

      it 'will re-cache the settings on the item if the roles change' do
        expect(inheritance.private_child?(item)).to be true
        # now the setting should be cached
        expect(item.cached_inheritance['private']).to be true
        add_roles(Role::EDITOR, editors, item)
        # the caching only checks for updated_at to the second, have to fudge that
        item.roles.first.update(updated_at: 10.seconds.from_now)
        expect(inheritance.private_child?(item)).to be false
        expect(item.cached_inheritance['private']).to be false
      end
    end
  end

  def add_roles(role_name, user_or_users, object_or_objects)
    users = *user_or_users
    objects = *object_or_objects
    users.map do |user|
      objects.map do |object|
        user.add_role(role_name, object)
      end
    end.flatten
  end
end
