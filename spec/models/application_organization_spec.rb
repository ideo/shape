require 'rails_helper'

RSpec.describe ApplicationOrganization, type: :model do
  describe 'callbacks' do
    let!(:application_organization) { create(:application_organization) }
    let(:application_user) { application_organization.application_user }
    let(:organization) { application_organization.organization }

    describe '#add_bot_user_to_organization' do
      it 'creates global collection' do
        expect {
          create(:application_organization)
        }.to change(Collection::ApplicationCollection, :count).by(1)
      end

      it 'adds user as editor' do
        Sidekiq::Testing.inline! do
          collection = application_organization.root_collection
          expect(
            application_user.has_role?(Role::EDITOR, collection),
          ).to be true
        end
      end

      it 'adds application user role' do
        expect(
          application_user.has_role?(Role::APPLICATION_USER, organization),
        ).to be true
      end

      context 'if bot user already has a current collection' do
        let(:app_org_two) do
          create(:application_organization,
                 application: application_organization.application)
        end

        it 'creates new collection' do
          expect {
            app_org_two
          }.to change(Collection::ApplicationCollection, :count).by(1)
          expect(
            app_org_two.root_collection_id,
          ).not_to eq(application_organization.root_collection_id)
        end
      end
    end

    describe '#remove_user_from_organization' do
      it 'removes user as org member' do
        Sidekiq::Testing.inline! do
          application_organization.destroy
          expect(
            application_user.has_role?(Role::APPLICATION_USER, organization),
          ).to be false
        end
      end
    end
  end
end
