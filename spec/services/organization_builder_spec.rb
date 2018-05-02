require 'rails_helper'

RSpec.describe OrganizationBuilder, type: :service do
  let(:user) { create(:user) }
  let(:params) {
    {
      'name': 'An org',
      'handle': 'an-org',
    }
  }

  describe '#save' do
    let!(:builder) {
      OrganizationBuilder.new(params,
                              user)
    }
    let!(:result) { builder.save }
    let!(:organization) { builder.organization }

    before do
      user.switch_to_organization(organization)
    end

    it 'should be true' do
      expect(result).to be true
    end

    it 'should add the user as an admin role' do
      expect(user.has_role?(Role::ADMIN, organization.primary_group)).to be true
    end

    it 'should create the user collections' do
      expect(user.current_user_collection).to_not be_nil
      expect(user.current_shared_collection).to_not be_nil
    end

    it 'should update the primary group attributes' do
      expect(organization.primary_group.handle).to eq('an-org')
    end
  end
end
