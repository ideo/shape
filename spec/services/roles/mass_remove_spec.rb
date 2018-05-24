require 'rails_helper'

RSpec.describe Roles::MassRemove, type: :service do
  let(:organization) { create(:organization) }
  let(:collection) { create(:collection, num_cards: 5) }
  let!(:subcollection_card) do
    create(:collection_card_collection, parent: collection)
  end
  let(:subcollection) { subcollection_card.collection }
  let(:grandchildren) { create_list(:collection_card_text, 3, parent: subcollection) }
  let(:users) { create_list(:user, 1, add_to_org: organization) }
  let(:groups) { create_list(:group, 1) }
  let(:role_name) { Role::EDITOR }
  let(:remove_from_children_sync) { true }
  let(:remove_link) { false }
  let(:mass_remove) do
    Roles::MassRemove.new(
      object: collection,
      role_name: role_name,
      users: users,
      groups: groups,
      remove_from_children_sync: remove_from_children_sync,
      remove_link: remove_link,
    )
  end

  describe '#call' do
    let(:user) { users.first }
    let(:groups) { create_list(:group, 1) }
    let(:group) { groups.first }
    let(:user_3) { create(:user) }
    let!(:role) { user.add_role(role_name, collection) }

    before do
      collection.items.each do |item|
        user.add_role(role_name, item)
        group.add_role(role_name, item)
      end
      user.add_role(role_name, subcollection)
      group.add_role(role_name, subcollection)
    end

    it 'should remove editor role from all card items' do
      expect(collection.items.all? do |item|
        user.has_role?(role_name, item) && group.has_role?(role_name, item)
      end).to be true

      expect(mass_remove.call).to be true
      user.reload
      group.reload

      expect(collection.items.all? do |item|
        user.has_role?(role_name, item) && group.has_role?(role_name, item)
      end).to be false
    end

    it 'should remove editor role from sub-collection' do
      expect(user.has_role?(role_name, subcollection)).to be true
      expect(group.has_role?(role_name, subcollection)).to be true
      expect(mass_remove.call).to be true
      user.reload
      group.reload
      expect(user.has_role?(role_name, subcollection)).to be false
      expect(group.has_role?(role_name, subcollection)).to be false
    end

    context 'with remove_link true' do
      let!(:remove_link) { true }

      it 'removes links from user collections' do
        expect(UnlinkFromSharedCollectionsWorker).to receive(:perform_async).with(
          [user.id] + group.roles.reduce([]) { |acc, role| acc + role.users },
          groups.map(&:id),
          [collection.id],
          [],
        )
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
        let!(:role_name) { :admin }
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

        let(:mass_remove) do
          Roles::MassRemove.new(
            object: object,
            role_name: role_name,
            users: users,
            groups: groups,
            remove_from_children_sync: remove_from_children_sync,
            remove_link: remove_link,
          )
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

        context 'when the object is a primary group' do
          let!(:object) { organization.primary_group }

          it 'should link all the groups shared collection cards' do
            expect(organization).to receive(:remove_user_membership).with(
              user,
            )
            mass_remove.call
          end
        end
      end
    end

    context 'remove_from_children_sync = true' do
      it 'should call worker for each grandchild' do
        expect(MassRemoveRolesWorker).to receive(:perform_async).exactly(grandchildren.count).times
        mass_remove.call
      end
    end

    context 'with another user that has the same role' do
      before do
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

      it 'queues worker for itself again to remove children' do
        expect(MassRemoveRolesWorker).to receive(:perform_async).with(
          collection.id,
          collection.class.name,
          Role::EDITOR,
          users.map(&:id),
          groups.map(&:id),
        )
        mass_remove.call
      end
    end

    context 'with comment_threads' do
      let(:comment_thread) { create(:comment_thread, record: collection) }

      it 'removes all followers from comment threads if they no longer have access' do
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
