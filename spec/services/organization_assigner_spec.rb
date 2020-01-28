require 'rails_helper'

RSpec.describe OrganizationShellBuilder, type: :service do
  describe '#call' do
    let(:user) { create(:user) }
    let(:params) do
      {
        'name': 'An org',
        'handle': 'an-org',
      }
    end
    let(:builder) do
      OrganizationAssigner.new(params, user, false)
    end
    let!(:shell_organization) do
      # Create a shell we can assign with
      shell_builder = OrganizationShellBuilder.new
      shell_builder.save
      shell_builder.organization.update(name: 'poop')
      shell_builder.organization
    end
    let(:network_organization) { double('network_organization') }
    let(:subscription) { double('subscription') }

    before do
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
  end
end
