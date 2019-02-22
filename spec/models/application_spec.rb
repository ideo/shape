require 'rails_helper'

RSpec.describe Application, type: :model do
  describe 'callbacks' do
    describe '#create_user' do
      let(:application) { create(:application) }

      it 'creates a new user for the application' do
        expect {
          application
        }.to change(User, :count).by(1)
      end

      it 'should set terms_accepted to true for the user' do
        expect(application.user.terms_accepted).to be true
      end
    end

    describe '#update_application_collection_names' do
      let(:organization) { create(:organization) }
      let(:application) { create(:application, name: 'MySpace', add_orgs: [organization]) }
      let(:user) { application.user }
      let(:application_collection) do
        Collection::ApplicationCollection.find_or_create_for_bot_user(user, organization)
      end

      it 'changes the name of the application_collection when the name changes' do
        expect(application_collection.name).to eq application.name
        application.update(name: 'Instagram')
        expect(application_collection.reload.name).to eq application.name
      end
    end
  end
end
