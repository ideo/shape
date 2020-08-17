require 'rails_helper'

RSpec.describe OrganizationAssigner, type: :service do
  describe '#call' do
    let(:user) { create(:user) }
    let(:params) do
      {
        'name': 'An org',
        'handle': 'an-org',
      }
    end
    let(:builder) do
      OrganizationAssigner.new(params, user, full_setup: false)
    end

    context 'with a shell organization' do
      let(:user_collection) do
        Collection::UserCollection.find_by(organization: builder.organization)
      end
      let!(:shell_organization) do
        # Create a shell we can assign with
        shell_builder = OrganizationShellBuilder.new
        shell_builder.save
        shell_builder.organization.update(name: 'shell-0')
        shell_builder.organization
      end

      before do
        allow(OrganizationShellWorker).to receive(:perform_async)
      end

      context 'after calling builder' do
        before do
          builder.call
        end

        it 'should update the org information with the params' do
          expect(builder.organization.name).to eq 'An org'
          expect(builder.organization.handle).to eq 'an-org'
          expect(builder.organization.shell).to be false
        end

        it 'should update the primary group with params' do
          expect(builder.organization.primary_group.name).to eq 'An org'
          expect(builder.organization.primary_group.handle).to eq 'an-org'
        end

        it 'should assign the user as an admin to the org primary group' do
          expect(user.has_role?(Role::ADMIN, builder.organization.primary_group)).to be true
        end

        it 'should assign the user collection to the user' do
          expect(user.has_role?(Role::EDITOR, user_collection)).to be true
        end

        it 'should call OrganizationShellWorker to set up the next shell org' do
          expect(OrganizationShellWorker).to have_received(:perform_async)
        end
      end

      context 'with challenge groups already created' do
        # this creates w/ groups
        let!(:challenge) { create(:collection, :challenge, created_by: nil, organization: shell_organization) }

        it 'should assign the user as admin of the Admin group' do
          builder.call
          expect(challenge.challenge_admin_group.can_edit?(user)).to be true
        end
      end
    end

    context 'without an existing shell organization' do
      it 'should create a shell organization and use it' do
        expect {
          builder.call
        }.to change(Organization, :count).by(1)
      end
    end
  end
end
