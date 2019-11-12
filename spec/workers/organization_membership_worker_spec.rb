require 'rails_helper'

RSpec.describe OrganizationMembershipWorker, type: :worker do
  let(:organization) { create(:organization) }
  let(:users) { create_list(:user, 2) }

  describe '#perform' do
    it 'should setup all users into the organization' do
      users.each do |user|
        expect(organization.can_view?(user)).to be false
        expect(user.current_organization).to eq nil
      end
      OrganizationMembershipWorker.new.perform(users.pluck(:id), organization.id)
      users.each do |user|
        user.reload.reset_cached_roles!
        expect(user.current_organization).to eq organization
        expect(organization.can_view?(user)).to be true
        expect(organization.guest_group.can_view?(user)).to be true
      end
    end
  end
end
