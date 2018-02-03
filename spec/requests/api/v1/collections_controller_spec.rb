require 'rails_helper'

describe Api::V1::CollectionsController, type: :request do
  describe 'GET #show' do
    let!(:collection) {
      create(:collection, num_cards: 5)
    }
    let(:path) { "/api/v1/collections/#{collection.id}.json" }

    it 'should have 200 status' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'should have expected JSON' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('collection')
    end

    it 'should have included CollectionCard JSON' do
      get(path)
      expect(json['data']['included'][0]).to match_json_schema('collection_card')
    end
  end
end
