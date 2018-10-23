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
      before do
        allow(builder.organization).to receive(:create_network_organization)
        allow(builder.organization).to receive(:create_network_subscription)
        user.switch_to_organization(organization)
      end

      let!(:result) { builder.save }
      let!(:organization) { builder.organization }

      it 'should return true' do
        expect(result).to be true
      end

      it 'should set the trial ends at date' do
        expect(organization.trial_ends_at).to be_within(5.seconds)
          .of(Organization::DEFAULT_TRIAL_ENDS_AT.from_now)
      end

      it 'should set the default trial user count' do
        expect(organization.trial_users_count).to eql(Organization::DEFAULT_TRIAL_USERS_COUNT)
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

      it 'should create the templates' do
        expect(OrganizationTemplates).to receive(:call).with(organization)
        builder.save
        expect(user.user_profile_for_org(organization.id)).not_to be nil
      end

      it 'should create the network organization' do
        expect(organization).to have_received(:create_network_organization).with(user)
      end
      it 'should create the network organization' do
        expect(organization).to have_received(:create_network_subscription)
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
