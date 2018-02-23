require 'rails_helper'

describe Api::V1::CollectionCardsController, type: :request, auth: true do
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
    let(:path) { "/api/v1/collection_cards" }
    let(:params) {
      json_api_params(
        'collection_cards',
        {
          'order': 1,
          'width': 3,
          'height': 1,
          # parent_id is required to retrieve the parent collection without a nested route
          'parent_id': collection.id,
        }
      )
    }

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      post(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('collection_card')
    end

    context 'with item attrs' do
      let(:params_with_item) {
        json_api_params(
          'collection_cards',
          {
            'order': 1,
            'width': 3,
            'height': 1,
            # parent_id is required to retrieve the parent collection without a nested route
            'parent_id': collection.id,
            'item_attributes': {
              'type': 'Item::TextItem',
              'content': 'Mary had a little lamb...',
            },
          }
        )
      }

      it 'returns a 200' do
        post(path, params: params_with_item)
        expect(response.status).to eq(200)
      end

      it 'creates record' do
        expect {
          post(path, params: params_with_item)
        }.to change(Item, :count).by(1)
      end
    end

    context 'with filestack file attrs' do
      let(:filename) { 'apple.jpg' }
      let(:filestack_file) { build(:filestack_file) }
      let(:params_with_filestack_file) {
        json_api_params(
          'collection_cards',
          {
            'order': 1,
            'width': 3,
            'height': 1,
            # parent_id is required to retrieve the parent collection without a nested route
            'parent_id': collection.id,
            'item_attributes': {
              'type': 'Item::ImageItem',
              'filestack_file_attributes': {
                'url': filestack_file.url,
                'handle': filestack_file.handle,
                'size': filestack_file.size,
                'mimetype': filestack_file.mimetype,
                'filename': filename,
              }
            },
          }
        )
      }

      it 'returns a 200' do
        post(path, params: params_with_filestack_file)
        expect(response.status).to eq(200)
      end

      it 'creates record' do
        expect {
          post(path, params: params_with_filestack_file)
        }.to change(FilestackFile, :count).by(1)
      end

      it 'has filename without extension as name' do
        post(path, params: params_with_filestack_file)
        item = json_included_objects_of_type('items').first
        expect(item['attributes']['name']).to eq('apple')
      end
    end
  end

  describe 'PATCH #update' do
    let!(:collection_card) { create(:collection_card) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}" }
    let(:params) {
      json_api_params(
        'collection_cards',
        {
          'order': 2,
          'width': 1,
          'height': 3
        }
      )
    }

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('collection_card')
    end

    it 'updates the content' do
      expect(collection_card.order).not_to eq(2)
      patch(path, params: params)
      expect(collection_card.reload.order).to eq(2)
    end
  end
end
