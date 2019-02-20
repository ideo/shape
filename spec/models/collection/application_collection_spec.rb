require 'rails_helper'

describe Collection::ApplicationCollection, type: :model do
  describe '.find_or_create_for_bot_user' do
    let(:organization) { create(:organization) }
    let(:application) { create(:application) }
    let(:user) { application.user }
    let(:application_collection) do
      Collection::ApplicationCollection.find_or_create_for_bot_user(user, organization)
    end

    it 'should create a Collection::ApplicationCollection in the organization' do
      expect(application_collection.persisted?).to be true
      expect(application_collection.organization).to eq organization
    end

    it 'the user should be an editor' do
      expect(application_collection.editors[:users]).to include(user)
    end

    context 'with existing collection' do
      let!(:existing) do
        create(:application_collection, organization: organization)
      end

      before do
        user.add_role(Role::EDITOR, existing)
      end

      it 'should return the existing Collection::ApplicationCollection' do
        expect(application_collection.id).to eq existing.id
        expect(application_collection.organization).to eq organization
      end
    end
  end
end
