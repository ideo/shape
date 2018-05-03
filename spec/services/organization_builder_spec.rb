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
    let(:builder) {
      OrganizationBuilder.new(params,
                              user)
    }
    context 'with valid params' do
      let!(:result) { builder.save }
      let!(:organization) { builder.organization }

      before do
        user.switch_to_organization(organization)
      end

      it 'should return true' do
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

    context 'with invalid params' do
      let(:params) { { name: nil } }

      it 'should return false' do
        expect(builder.save).to be false
      end

      it 'should rollback the transaction' do
        expect {
          builder.save
        }.to not_change(Organization, :count)
          .and not_change(Group, :count)
      end
    end
  end
end
