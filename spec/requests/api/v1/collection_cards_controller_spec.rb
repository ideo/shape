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
            order: 1,
            width: 3,
            height: 1,
            # parent_id is required to retrieve the parent collection without a nested route
            parent_id: collection.id,
            item_attributes: {
              type: 'Item::VideoItem',
              name: 'Youtube video',
              url: 'https://www.youtube.com/watch?v=4r7wHMg5Yjg',
              thumbnail_url: 'https://img.youtube.com/vi/4r7wHMg5Yjg/hqdefault.jpg',
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

  describe 'PATCH #move' do
    let!(:from_collection) { create(:collection, num_cards: 3, add_editors: [user]) }
    let!(:moving_cards) { from_collection.collection_cards.first(2) }
    let!(:unmoved_card) { from_collection.collection_cards.last }
    let(:path) { '/api/v1/collection_cards/move' }
    let(:raw_params) do
      {
        from_id: from_collection.id,
        to_id: to_collection.id,
        collection_card_ids: moving_cards.map(&:id),
        placement: 'beginning',
      }
    end
    let(:params_at_end) { raw_params.merge(placement: 'end').to_json }
    let(:params) { raw_params.to_json }

    describe 'without manage access for to_collection' do
      let(:to_collection) { create(:collection) }

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    describe 'with manage access for to_collection' do
      let(:editor) { create(:user) }
      let(:viewer) { create(:user) }
      let(:to_collection) do
        create(:collection, num_cards: 3, add_editors: [user, editor], add_viewers: [viewer])
      end

      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'moves cards from one collection to the other' do
        expect(moving_cards.map(&:parent_id).uniq).to match_array [from_collection.id]
        patch(path, params: params)
        expect(moving_cards.map(&:reload).map(&:parent_id).uniq).to match_array [to_collection.id]
      end

      it 'only moves specified cards' do
        expect(unmoved_card.parent_id).to eq from_collection.id
        patch(path, params: params)
        expect(unmoved_card.reload.parent_id).to eq from_collection.id
      end

      it 'moves new cards to the front of the collection' do
        patch(path, params: params)
        combined_cards = to_collection.reload.collection_cards
        # expect to find moved card at the front
        expect(combined_cards.first).to eq moving_cards.first
        # expect not to find moved cards at the end
        expect(combined_cards.last).not_to eq moving_cards.last
        expect(combined_cards.count).to eq 5
      end

      it 'moves new cards to the bottom of the collection if placement: end' do
        patch(path, params: params_at_end)
        combined_cards = to_collection.reload.collection_cards
        # expect to find moved card at the end
        expect(combined_cards.last).to eq moving_cards.last
        # expect to find moved card at the end
        expect(combined_cards.first).not_to eq moving_cards.first
        expect(combined_cards.count).to eq 5
      end

      it 're-assigns permissions' do
        patch(path, params: params)
        expect(moving_cards.first.record.editors[:users].last).to eq editor
        expect(moving_cards.first.record.viewers[:users].last).to eq viewer
      end
    end
  end
end
