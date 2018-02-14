require 'rails_helper'

describe Collection::UserCollection, type: :model do
  describe '.find_or_create_for_user' do
    let(:organization) { create(:organization) }
    let(:user) { create(:user) }
    let!(:user_collection) {
      Collection::UserCollection.find_or_create_for_user(user, organization)
    }
    let(:shared_with_me_collection) {
      user_collection.shared_with_me_collection
    }

    it 'should create a Collection::UserCollection' do
      expect(user_collection.persisted?).to be true
    end

    it 'the user should be an editor' do
      expect(user_collection.editors).to include(user)
    end

    it 'should have a sub-collection of Collection::SharedWithMeCollection' do
      expect(shared_with_me_collection.persisted?).to be true
      expect(shared_with_me_collection).to be_instance_of(Collection::SharedWithMeCollection)
    end
  end
end
