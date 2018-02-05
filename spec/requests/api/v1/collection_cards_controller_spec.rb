require 'rails_helper'

describe Api::V1::CollectionCardsController, type: :request do
  describe 'GET #index' do
    let!(:collection) { create(:collection, num_cards: 5) }
    let(:path) { "/api/v1/collections/#{collection.id}/collection_cards" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data'].first['attributes']).to match_json_schema('collection_card')
    end

    it 'includes all collection cards' do
      get(path)
      expect(json['data'].map { |cc| cc['id'].to_i }).to match_array(collection.collection_card_ids)
    end
  end

  describe 'GET #show' do
    let!(:collection_card) { create(:collection_card) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('collection_card')
    end
  end

  describe 'POST #create' do
    let!(:collection) { create(:collection) }
    let(:path) { "/api/v1/collections/#{collection.id}/collection_cards" }
    let(:collection_card_params) {
      {
        'order': 1,
        'width': 3,
        'height': 1
      }
    }

    it 'returns a 200' do
      post(path, params: { collection_card: collection_card_params })
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      post(path, params: { collection_card: collection_card_params })
      expect(json['data']['attributes']).to match_json_schema('collection_card')
    end
  end

  describe 'PATCH #update' do
    let!(:collection_card) { create(:collection_card) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}" }
    let(:collection_card_params) {
      {
        'order': 2,
        'width': 1,
        'height': 3
      }
    }

    it 'returns a 200' do
      patch(path, params: { collection_card: collection_card_params })
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: { collection_card: collection_card_params })
      expect(json['data']['attributes']).to match_json_schema('collection_card')
    end

    it 'updates the content' do
      expect(collection_card.order).not_to eq(2)
      patch(path, params: { collection_card: collection_card_params })
      expect(collection_card.reload.order).to eq(2)
    end
  end
end
