require 'rails_helper'

describe Api::V1::CollectionsController, type: :request do
  describe 'GET #show' do
    let!(:collection) {
      create(:collection, num_cards: 5)
    }
    let(:path) { "/api/v1/collections/#{collection.id}.json" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('collection')
    end

    describe 'included' do
      let(:collection_cards_json) { json_included_objects_of_type('collection_cards') }
      let(:items_json) { json_included_objects_of_type('items') }

      it 'returns all collection cards' do
        get(path)
        expect(collection_cards_json.map { |cc| cc['id'].to_i }).to match_array(collection.collection_card_ids)
      end

      it 'matches CollectionCard schema' do
        get(path)
        expect(collection_cards_json.first['attributes']).to match_json_schema('collection_card')
      end

      it 'returns all items' do
        get(path)
        expect(items_json.map { |i| i['id'].to_i }).to match_array(collection.item_ids)
      end

      it 'matches Item schema' do
        get(path)
        expect(items_json.first['attributes']).to match_json_schema('item')
      end
    end

    context 'with nested collection' do
      let!(:nested_collection) { create(:collection) }
      let(:collections_json) { json_included_objects_of_type('collections') }

      before do
        create(:collection_card_collection,
               parent: collection,
               collection: nested_collection)
      end

      it 'returns nested Collection' do
        get(path)
        expect(collections_json.map { |c| c['id'].to_i }).to include(nested_collection.id)
      end

      it 'matches Collection schema' do
        get(path)
        expect(collections_json.first['attributes']).to match_json_schema('collection')
      end
    end
  end
end
