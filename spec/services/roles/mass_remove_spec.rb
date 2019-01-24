require 'rails_helper'

RSpec.describe Roles::MassRemove, type: :service do
  let(:organization) { create(:organization) }
  let(:collection) { create(:collection) }
  let(:object) { collection }
  let(:users) { create_list(:user, 1, add_to_org: organization) }
  let(:groups) { create_list(:group, 1) }
  let(:role_name) { Role::EDITOR }
  let(:remove_from_children_sync) { true }
  let(:propagate_to_children) { false }
  let(:removed_by) { create(:user) }
  let(:fully_remove) { false }
  let(:mass_remove) do
    Roles::MassRemove.new(
      object: object,
      role_name: role_name,
      users: users,
      groups: groups,
      propagate_to_children: propagate_to_children,
      removed_by: removed_by,
      fully_remove: fully_remove,
    )
  end

  describe '#call' do
    let(:user) { users.first }
    let(:groups) { create_list(:group, 1) }
    let(:group) { groups.first }
    let(:user_3) { create(:user) }
    let(:collection) { create(:collection, num_cards: 3, add_editors: [user, group]) }

    before do
      collection.items.update_all(roles_anchor_collection_id: collection.id)
    end

    it 'should automatically change roles on anchored children items' do
      expect(collection.items.all? do |item|
        item.reload
        item.can_edit?(user) && item.can_edit?(group)
      end).to be true

      expect(mass_remove.call).to be true

      expect(collection.items.all? do |item|
        item.reload
        item.can_edit?(user) && item.can_edit?(group)
      end).to be false
    end

    context 'with propagate_to_children true' do
      let(:propagate_to_children) { true }
      let(:previous_anchor_id) { nil }

      before do
        object.reload # reload to get object.children
      end

      context 'with no children' do
        let(:collection) { create(:collection, add_editors: [user]) }
        it 'should not call ModifyChildrenRolesWorker' do
          expect(ModifyChildrenRolesWorker).not_to receive(:perform_async)
          mass_remove.call
        end
      end

      context 'with children' do
        it 'should call ModifyChildrenRolesWorker with method = remove' do
          expect(ModifyChildrenRolesWorker).to receive(:perform_async).with(
            removed_by.id,
            users.map(&:id),
            groups.map(&:id),
            role_name,
            object.id,
            object.class.name,
            previous_anchor_id,
            'remove',
          )
          mass_remove.call
        end
      end

      context 'with previous anchor' do
        let(:previous_anchor_id) { 99 }
        let(:object) { create(:collection, num_cards: 1, roles_anchor_collection_id: previous_anchor_id) }

        it 'should call ModifyChildrenRolesWorker with previous_anchor_id' do
          expect(ModifyChildrenRolesWorker).to receive(:perform_async).with(
            removed_by.id,
            users.map(&:id),
            groups.map(&:id),
            role_name,
            object.id,
            object.class.name,
            previous_anchor_id,
            'remove',
          )
          mass_remove.call
        end
      end
    end

    context 'with fully_remove true' do
      let!(:fully_remove) { true }

      it 'removes links from user collections' do
        expect(UnlinkFromSharedCollectionsWorker).to receive(:perform_async).with(
          [user.id] + group.roles.reduce([]) { |acc, role| acc + role.users },
          groups.map(&:id),
          [collection.id],
          [],
        )
        mass_remove.call
      end

      it 'does not remove the user from the organization' do
        expect(organization).to_not receive(:remove_user_membership)
        mass_remove.call
      end

      context 'with a user and a group which contains the same user' do
        let!(:users) { create_list(:user, 1, add_to_org: organization) }
        let!(:groups) { [create(:group, add_members: [users.first])] }

        it 'should only pass unique ids to create links' do
          expect(UnlinkFromSharedCollectionsWorker).to receive(:perform_async).with(
            users.map(&:id),
            groups.map(&:id),
            [collection.id],
            [],
          )
          mass_remove.call
        end
      end

      context 'when the object is a group' do
        let!(:organization) { create(:organization) }
        let!(:role_name) { :member }
        let!(:user) { create(:user, add_to_org: organization) }
        let!(:users) { [user] }
        let!(:linked_collection) { create(:collection) }
        let!(:object) { create(:group) }
        let!(:link) do
          create(:collection_card_link,
                 parent: object.current_shared_collection,
                 collection: linked_collection)
        end
        let(:comment_threads) do
          create_list(:collection_comment_thread, 2, add_group_followers: [object])
        end

        it 'should link all the groups shared collection cards' do
          expect(UnlinkFromSharedCollectionsWorker).to receive(:perform_async).with(
            users.map(&:id),
            groups.map(&:id),
            [linked_collection.id],
            [],
          )
          mass_remove.call
        end

        it 'should remove users as followers of the group threads' do
          expect(RemoveCommentThreadFollowers).to receive(:perform_async).with(
            comment_threads.map(&:id),
            users.map(&:id),
          )
          mass_remove.call
        end

        context 'with propagate_to_children true' do
          it 'still should not call ModifyChildrenRolesWorker' do
            expect(ModifyChildrenRolesWorker).not_to receive(:perform_async)
            mass_remove.call
          end
        end

        context 'when the object is a primary group' do
          let!(:object) { organization.primary_group }
          let(:fully_remove) { true }

          it 'should remove the user from the organization' do
            expect(organization).to receive(:remove_user_membership).with(
              user,
            )
            mass_remove.call
          end
        end

        context 'when the object is a guest group, but user is a primary member' do
          let!(:object) { organization.guest_group }
          let(:fully_remove) { true }

          it 'should not remove the user from the organization' do
            expect(organization).to_not receive(:remove_user_membership).with(
              user,
            )
            mass_remove.call
          end
        end
      end
    end

    context 'with another user that has the same role' do
      before do
        collection.items.each(&:unanchor_and_inherit_roles_from_anchor!)
        collection.items.each { |i| user_3.add_role(role_name, i) }
      end

      it 'should leave any other roles from a different user' do
        expect(mass_remove.call).to be true
        user_3.reload
        expect(collection.items.all? { |i| user_3.has_role?(role_name, i) }).to be true
      end
    end

    context 'if user did not have role' do
      let!(:role_name) { Role::VIEWER }

      it 'should not fail if user did not have role' do
        expect(mass_remove.call).to be true
      end
    end

    context 'remove_from_children_sync = false' do
      let!(:remove_from_children_sync) { false }

      it 'removes role from object synchronously' do
        expect(user.has_role?(role_name, collection)).to be true
        expect(mass_remove.call).to be true
        expect(user.reload.has_role?(role_name, collection)).to be false
      end
    end

    context 'with comment_threads' do
      let(:comment_thread) { create(:comment_thread, record: collection) }

      it 'removes all followers from comment threads if they no longer have access' do
        collection.reload
        expect(RemoveCommentThreadFollowers).to receive(:perform_async).with(
          comment_thread.id,
          users.map(&:id),
          groups.map(&:id),
        )
        mass_remove.call
      end
    end
  end
end
