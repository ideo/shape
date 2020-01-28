require 'rails_helper'

RSpec.describe OrganizationShellBuilder, type: :service do
  describe '#call', :vcr do
    let(:user) { create(:user) }
    let(:params) do
      {
        'name': 'An org',
        'handle': 'an-org',
      }
    end
    let(:builder) do
      OrganizationAssigner.new(params, user, true)
    end
    let(:network_organization) { spy('network organization') }
    let(:shell_organization) do
      # Create a shell we can assign with
      shell_builder = OrganizationShellBuilder.new(true)
      shell_builder.save
      shell_builder.organization
    end

    before do
      allow(shell_organization).to receive(:create_network_organization)
      allow(shell_organization).to receive(:create_network_subscription)
      builder.call
    end

    it 'should update the org information with the params' do
      expect(builder.organization.name).to eq 'An org'
      expect(builder.organization.handle).to eq 'an-org'
    end

    it 'should update the primary group with params' do
      expect(builder.organization.primary_group.name).to eq 'An org'
      expect(builder.organization.primary_group.handle).to eq 'an-org'
    end

    it 'should assign the user as an admin to the org primary group' do
      expect(user.has_role?(Role::ADMIN, builder.organization.primary_group)).to be true
    end

    it 'should assign the user collection to the user' do
      user_collection = Collection::UserCollection.find_by(organization:
                                                           builder.organization)
      expect(user.has_role?(Role::EDITOR, user_collection)).to be true
    end

    it 'should call setup user membership with the first admin' do
      expect(shell_organization).to receive(:setup_user_membership).with(user).twice
    end

    it 'should create the network organization' do
      expect(shell_organization).to have_received(:create_network_organization).with(user)
    end

    it 'should create the network organization' do
      expect(shell_organization).to have_received(:create_network_subscription)
    end
  end
end
