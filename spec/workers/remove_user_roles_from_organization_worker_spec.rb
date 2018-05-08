require 'rails_helper'

RSpec.describe RemoveUserRolesFromOrganizationWorker, type: :worker do
  describe '#perform' do
    let(:organization) { create(:organization) }
    let(:user) { create(:user, add_to_org: organization) }
    let(:collection) { create(:collection, num_cards: 2, organization: organization) }
    let(:other_collection) { create(:collection, num_cards: 1, organization: organization) }
    let(:orphaned_item) { other_collection.items.first }
    let(:group) { create(:group, organization: organization) }

    before do
      user.add_role(Role::EDITOR, collection)
      collection.items.each do |item|
        user.add_role(Role::EDITOR, item)
      end
      user.add_role(Role::EDITOR, orphaned_item)
      user.add_role(Role::MEMBER, group)
      RemoveUserRolesFromOrganizationWorker.new.perform(
        organization.id,
        user.id,
      )
    end

    it 'should remove all user roles for collection' do
      expect(user.has_role?(Role::EDITOR, collection)).to be false
    end

    it 'should remove all user roles for items' do
      expect(collection.items.all? do |item|
        user.has_role?(Role::EDITOR, item)
      end).to be false
    end

    it 'should remove all user roles for orphaned items' do
      expect(user.has_role?(Role::EDITOR, orphaned_item)).to be false
    end

    it 'should remove all user roles from groups' do
      expect(user.has_role?(Role::MEMBER, group)).to be false
    end
  end
end
