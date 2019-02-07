require 'rails_helper'

RSpec.describe ApplicationOrganization, type: :model do
  describe 'callbacks' do
    let!(:application_organization) { create(:application_organization) }
    let(:application_user) { application_organization.application_user }
    let(:organization) { application_organization.organization }

    describe '#create_user_and_add_to_organization' do
      it 'creates global collection' do
        expect {
          create(:application_organization)
        }.to change(Collection::UserCollection, :count).by(1)
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
