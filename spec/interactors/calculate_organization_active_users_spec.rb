require 'rails_helper'

RSpec.describe CalculateOrganizationActiveUsers, type: :service do
  let(:organization) { create(:organization) }
  subject(:context) { CalculateOrganizationActiveUsers.call(organization: organization) }

  describe '#call' do
    let(:pending_user) do
      create(:user, :recently_active, current_organization: organization, status: User.statuses[:pending], first_name: 'pending_user')
    end
    let(:deleted_user) do
      create(:user, :recently_active, current_organization: organization, status: User.statuses[:deleted], first_name: 'deleted_user')
    end
    let(:recently_active_user) do
      create(:user, :recently_active, current_organization: organization, first_name: 'recently_active_user')
    end
    let(:recently_active_guest_user) do
      create(:user, :recently_active, current_organization: organization, first_name: 'recently_active_guest_user')
    end
    let(:not_recently_active_user) { create(:user, first_name: 'not_recently_active_user') }
    let(:not_recently_active_guest_user) { create(:user, first_name: 'not_recently_active_guest_user') }

    before do
      pending_user.add_role(Role::MEMBER, organization.primary_group)
      deleted_user.add_role(Role::MEMBER, organization.primary_group)
      recently_active_user.add_role(Role::MEMBER, organization.primary_group)
      recently_active_guest_user.add_role(Role::ADMIN, organization.guest_group)
      not_recently_active_user.add_role(Role::MEMBER, organization.primary_group)
      not_recently_active_guest_user.add_role(Role::ADMIN, organization.guest_group)
    end

    it 'updates active users count' do
      expect(context).to be_a_success
      expect(context.organization.active_users_count).to eql(2)
    end
  end
end
