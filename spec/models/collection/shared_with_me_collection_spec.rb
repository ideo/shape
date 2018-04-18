require 'rails_helper'

describe Collection::SharedWithMeCollection, type: :model do
  describe '.find_or_create_for_collection' do
    let(:user) { create(:user) }
    let(:parent_collection) { create(:collection) }
    let(:shared_with_me_collection) {
      Collection::SharedWithMeCollection.find_or_create_for_collection(
        parent_collection,
        user
      )
    }

    it 'should create a Collection::UserCollection' do
      expect {
        shared_with_me_collection
      }.to change(Collection::SharedWithMeCollection, :count).by(2)
    end

    it 'the collection should belong to same org as parent' do
      expect(shared_with_me_collection.organization).to eq(parent_collection.organization)
    end

    it 'should add user as editor' do
      expect(user.has_role?(Role::VIEWER, shared_with_me_collection.becomes(Collection))).to be true
    end
  end

  describe '.create_for_group' do
    let(:organization) { create(:organization) }
    let(:shared_with_me_collection) {
      Collection::SharedWithMeCollection.create_for_group(organization)
    }

    it 'should create a Collection::UserCollection' do
      expect {
        shared_with_me_collection
      }.to change(Collection::SharedWithMeCollection, :count).by(2)
    end
  end
end
