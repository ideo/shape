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

  describe '#inherit_from_parent?' do
    let(:all_objects) {
      [collection] + collection.children
    }
    let(:editors) { create_list(:user, 2) }
    let(:viewers) { create_list(:user, 2) }
    let(:item) { collection.items.first }

    context 'same editors and viewers on all items' do
      before do
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

    context 'same users, different role' do
      before do
        add_roles(Role::EDITOR, editors, collection)
        add_roles(Role::VIEWER, editors, item)
        expect(inheritance.inherit_from_parent?(item)).to be false
      end

      it 'return false' do
        expect(inheritance.inherit_from_parent?(item)).to be false
      end
    end

    context 'same users, different roles' do
      before do
        add_roles(Role::EDITOR, editors, collection)
        add_roles(Role::VIEWER, viewers, item)
      end

      it 'returns false' do
        expect(inheritance.inherit_from_parent?(item)).to be false
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

    context 'when adding new roles, passing in potential child roles' do
      let(:addtl_viewer) { create(:user) }

      before do
        add_roles(Role::EDITOR, editors, all_objects)
        add_roles(Role::VIEWER, viewers, all_objects)
      end

      it 'returns true for child' do
        add_roles(Role::VIEWER, addtl_viewer, collection)
        new_user_role_identifiers = [UsersRole.identifier(role_name: Role::VIEWER, user_id: addtl_viewer.id)]
        expect(inheritance.inherit_from_parent?(item, new_user_role_identifiers)).to be true
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
