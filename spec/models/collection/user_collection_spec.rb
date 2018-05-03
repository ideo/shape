require 'rails_helper'

describe Collection::UserCollection, type: :model do
  describe '.find_or_create_for_user' do
    let(:organization) { create(:organization) }
    let!(:user) { create(:user) }
    let(:user_collection) do
      Collection::UserCollection.find_or_create_for_user(user, organization)
    end
    let(:shared_with_me_collection) do
      user_collection.shared_with_me_collection
    end

    it 'should create a Collection::UserCollection in the organization' do
      expect(user_collection.persisted?).to be true
      expect(user_collection.organization).to eq organization
    end

    it 'the user should be an editor' do
      expect(user_collection.editors[:users]).to include(user)
    end

    it 'should have a sub-collection of Collection::SharedWithMeCollection' do
      expect(shared_with_me_collection.persisted?).to be true
      expect(shared_with_me_collection).to be_instance_of(Collection::SharedWithMeCollection)
    end

    context 'with existing collection' do
      let!(:existing) do
        create(:user_collection, organization: organization)
      end

      before do
        user.add_role(Role::EDITOR, existing.becomes(Collection))
      end

      it 'should return the existing Collection::UserCollection' do
        expect(user_collection.id).to eq existing.id
        expect(user_collection.organization).to eq organization
      end
    end
  end
end
