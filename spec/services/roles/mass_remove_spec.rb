require 'rails_helper'

RSpec.describe Roles::MassRemove, type: :service do
  let!(:collection) { create(:collection, num_cards: 5) }
  let!(:subcollection_card) do
    create(:collection_card_collection, parent: collection)
  end
  let(:subcollection) { subcollection_card.collection }
  let(:users) { create_list(:user, 1) }
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
          collection.id,
          collection.class.name.to_s,
        )
        mass_remove.call
      end

      context 'with a user and a group which contains the same user' do
        let!(:users) { create_list(:user, 1) }
        let!(:groups) { [create(:group, add_members: [users.first])] }

        it 'should only pass unique ids to create links' do
          expect(UnlinkFromSharedCollectionsWorker).to receive(:perform_async).with(
            (users).map(&:id),
            collection.id,
            collection.class.name.to_s,
          )
          mass_remove.call
        end
      end
    end

    context 'if user has other roles on object' do
      before do
        collection.items.each { |i| user.add_role(Role::VIEWER, i) }
       { roles: [
        { id: 1, users: [
          { name: "Mo" }, { name: "Me" }
        ] },
        { id: 2, users: [
          { name: "No" }] }] }
      end

      it 'should leave any other roles from same user' do
        expect(mass_remove.call).to be true
        user.reload
        expect(collection.items.all? { |i| user.has_role?(Role::VIEWER, i) }).to be true
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
          collection.class.name.to_s,
          Role::EDITOR,
          users.map(&:id),
          groups.map(&:id),
        )
        mass_remove.call
      end
    end
  end
end
