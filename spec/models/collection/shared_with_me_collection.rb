require 'rails_helper'

describe Collection::SharedWithMeCollection, type: :model do
  describe '.create_for_user' do
    let(:parent_collection) { create(:collection) }
    let(:shared_with_me_collection) {
      Collection::SharedWithMeCollection.create_for_collection(parent_collection)
    }

    it 'should create a Collection::UserCollection' do
      expect {
        shared_with_me_collection
      }.to change(Collection::SharedWithMeCollection, :count).by(1)
    end

    it 'the collection should belong to same org as parent' do
      expect(shared_with_me_collection.organization).to eq(parent_collection.organization)
    end
  end

  describe '#collection_cards' do
    # TODO: should be a list of all collections and items
    # that have been shared with this user in this organization
  end
end
