require 'rails_helper'

RSpec.describe Roles::RemoveFromOrganization, type: :service do
  let(:organization) { create(:organization) }
  let(:user) { create(:user, add_to_org: organization) }
  let(:remove) do
    Roles::RemoveFromOrganization.new(
      organization,
      user,
    )
  end

  describe '#call' do
    it 'should call remove user roles from organization worker' do
      expect(RemoveUserRolesFromOrganizationWorker).to receive(:perform_async)
        .with(
          organization.id,
          user.id,
        )
      remove.call
    end
  end
end
