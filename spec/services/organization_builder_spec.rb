require 'rails_helper'

RSpec.describe OrganizationBuilder, type: :service do
  let(:user) { create(:user) }
  let(:params) do
    {
      'name': 'An org',
      'handle': 'an-org',
    }
  end

  describe '#save' do
    let(:builder) do
      OrganizationBuilder.new(params,
                              user)
    end
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

      it 'should not set any trial data by default' do
        expect(organization.trial_ends_at).to be_nil
        expect(organization.trial_users_count).to eq 0
      end

      it 'should initialize the active_users_count to 1' do
        expect(organization.active_users_count).to eq 1
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
        expect(OrganizationTemplates).to receive(:call).with(organization, user)
        builder.save
      end

      it 'should call setup_user_membership for the first admin' do
        expect(organization).to receive(:setup_user_membership).with(user).twice
        builder.save
      end

      it 'should create the network organization' do
        expect(organization).to have_received(:create_network_organization).with(user)
      end
      it 'should create the network organization' do
        expect(organization).to have_received(:create_network_subscription)
      end

      context 'with an application bot user' do
        let(:user) { create(:user, :application_bot) }

        it 'should create an application organization' do
          apporg = ApplicationOrganization.last
          expect(ApplicationOrganization.count).to be 1
          expect(apporg.application_id).to eq user.application.id
          expect(apporg.organization_id).to eq organization.id
        end
      end
    end

    context 'with invalid params' do
      let(:params) { { name: nil } }

      it 'should return false' do
        expect(builder.save).to be false
      end

      it 'should rollback the transaction' do
        expect do
          builder.save
        end.to not_change(Organization, :count)
          .and not_change(Group, :count)
      end
    end
  end
end
