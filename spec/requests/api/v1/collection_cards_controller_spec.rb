require 'rails_helper'

describe Api::V1::CollectionCardsController, type: :request, auth: true do
  let(:user) { @user }
  let(:collection) { create(:collection, add_editors: [user]) }

  describe 'GET #index' do
    let!(:collection) { create(:collection, num_cards: 5, add_editors: [user]) }
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
    let!(:collection_card) { create(:collection_card, parent: collection) }
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
    let(:path) { "/api/v1/collection_cards" }
    let(:raw_params) do
      {
        order: 1,
        width: 3,
        height: 1,
        # parent_id is required to retrieve the parent collection without a nested route
        parent_id: collection.id,
        # create with a nested item
        item_attributes: {
          content: 'This is my item content',
          text_data: { ops: [{ insert: 'This is my item content.' }] },
          type: 'Item::TextItem',
        },
      }
    end
    let(:params) { json_api_params('collection_cards', raw_params) }
    let(:bad_params) do
      json_api_params('collection_cards', raw_params.reject{ |k| k == :item_attributes })
    end

    context 'success' do
      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'creates record' do
        expect {
          post(path, params: params)
        }.to change(Item, :count).by(1)
      end

      it 'matches JSON schema' do
        post(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('collection_card')
      end

      it 'has collection as parent' do
        post(path, params: params)
        expect(CollectionCard.find(json['data']['attributes']['id']).parent).to eq(collection)
      end
    end

    context 'with errors' do
      it 'returns a 400 bad request' do
        post(path, params: bad_params)
        expect(response.status).to eq(400)
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

    context 'with video url attributes' do
      let(:filename) { 'apple.jpg' }
      let(:params_with_video_item) {
        json_api_params(
          'collection_cards',
          {
            'order': 1,
            'width': 3,
            'height': 1,
            # parent_id is required to retrieve the parent collection without a nested route
            'parent_id': collection.id,
            'item_attributes': {
              'type': 'Item::VideoItem',
              'url': 'https://www.youtube.com/watch?v=4r7wHMg5Yjg',
              'thumbnail_url': 'https://img.youtube.com/vi/4r7wHMg5Yjg/hqdefault.jpg',
            },
          }
        )
      }

      it 'returns a 200' do
        post(path, params: params_with_video_item)
        expect(response.status).to eq(200)
      end

      it 'creates video item' do
        expect {
          post(path, params: params_with_video_item)
        }.to change(Item::VideoItem, :count).by(1)
      end

      it 'returns item with given video url' do
        post(path, params: params_with_video_item)
        item = json_included_objects_of_type('items').first
        expect(item['attributes']['url']).to eq('https://www.youtube.com/watch?v=4r7wHMg5Yjg')
      end
    end
  end

  describe 'PATCH #update' do
    let!(:collection_card) { create(:collection_card, parent: collection) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}" }
    let(:params) {
      json_api_params(
        'collection_cards',
        {
          order: 2,
          width: 1,
          height: 3
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

  describe 'PATCH #archive' do
    let!(:collection_card) { create(:collection_card, parent: collection) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}/archive" }

    it 'returns a 200' do
      patch(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path)
      expect(json['data']['attributes']).to match_json_schema('collection_card')
    end

    it 'updates the content' do
      expect(collection_card.archived).to eq(false)
      patch(path)
      expect(collection_card.reload.archived).to eq(true)
    end
  end

  describe 'POST #duplicate' do
    let!(:collection_card) { create(:collection_card_text, parent: collection) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}/duplicate" }

    it 'returns a 200' do
      post(path)
      expect(response.status).to eq(200)
    end

    it 'creates new card' do
      expect { post(path) }.to change(CollectionCard, :count).by(1)
    end

    it 'creates new item' do
      expect { post(path) }.to change(Item, :count).by(1)
    end

    it 'returns new card' do
      post(path)
      expect(json['data']['attributes']['id']).not_to eq(collection_card.id)
    end
  end
end
