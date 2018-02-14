require 'rails_helper'

describe Collection::SharedWithMeCollection, type: :model do
  describe '.find_or_create_for_user' do
    let(:parent_collection) { create(:collection) }
    let(:shared_with_me_collection) {
      Collection::SharedWithMeCollection.find_or_create_for_collection(parent_collection)
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
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }
    let(:shared_with_me_collection) do
      Collection::UserCollection
        .find_or_create_for_user(user, organization)
        .shared_with_me_collection
    end

    it 'should be empty if nothing has been shared with me' do
      expect(shared_with_me_collection.collection_cards.size).to eq(0)
    end

    context 'with collections and items shared with me' do
      let(:collections) { create_list(:collection, 3, organization: organization) }
      let(:items) { create_list(:text_item, 3) }
      let(:org_2) { create(:organization) }

      before do
        collections.each do |collection|
          user.add_role(:viewer, collection)
        end

        items.each do |item|
          user.add_role(:viewer, item.becomes(Item))
        end
      end

      it 'should return all collections' do
        expect(
          shared_with_me_collection
          .collection_cards
          .map(&:collection)
          .compact
        ).to match_array(collections)
      end

      it 'should return all items' do
        expect(
          shared_with_me_collection
          .collection_cards
          .map(&:item)
          .compact
        ).to match_array(items)
      end

      # TODO: need to add this logic
      pending 'should not return any items from other orgs' do
        coll = create(:collection, organization: org_2)
        user.add_role(:viewer, coll)

        expect(
          shared_with_me_collection
          .collection_cards
          .map(&:collection)
          .compact
        ).not_to include(coll)
      end
    end
  end
end
