require 'rails_helper'

describe Api::V1::ItemsController, type: :request, auth: true do
  let(:user) { @user }

  describe 'GET #show' do
    let!(:item) { create(:text_item, add_viewers: [user]) }
    let(:path) { "/api/v1/items/#{item.id}" }
    let(:users_json) { json_included_objects_of_type('users') }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('item')
    end

    it 'returns can_edit as false' do
      get(path)
      expect(json['data']['attributes']['can_edit']).to eq(false)
    end

    context 'with editor' do
      let!(:item) { create(:text_item, add_editors: [user]) }

      it 'returns can_edit as true' do
        get(path)
        expect(json['data']['attributes']['can_edit']).to eq(true)
      end

      it 'includes only editors' do
        get(path)
        expect(users_json.map { |u| u['id'].to_i }).to match_array([user.id])
      end
    end

    context 'with viewer' do
      before do
        user.add_role(Role::VIEWER, item.becomes(Item))
      end

      it 'includes only viewer' do
        get(path)
        expect(users_json.map { |u| u['id'].to_i }).to match_array([user.id])
      end
    end

    context 'with parents' do
      let!(:collection) { create(:collection) }
      let!(:collection_card) { create(:collection_card_item, parent: collection) }
      let!(:item) { collection_card.item }

      before do
        user.add_role(Role::VIEWER, item.becomes(Item))
        item.reload
        item.recalculate_breadcrumb!
      end

      it 'returns breadcrumb with only item' do
        get(path)
        expect(json['data']['attributes']['breadcrumb'].size).to eq(1)
      end

      it 'returns full breadcrumb if user has access to parent' do
        user.add_role(Role::VIEWER, collection)
        get(path)
        expect(json['data']['attributes']['breadcrumb']).to match_array([
          ['collections', collection.id, collection.name],
          ['items', item.id, item.name]
        ])
      end
    end
  end

  describe 'POST #create' do
    let!(:collection) { create(:collection, add_editors: [user]) }
    let!(:collection_card) { create(:collection_card, parent: collection) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}/items" }
    let(:params) {
      json_api_params(
        'items',
        {
          type: 'Item::TextItem',
          content: 'A is for Apples',
          text_data: { ops: [{ insert: 'A is for Apples.' }] },
        }
      )
    }

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      post(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('item')
    end
  end

  describe 'PATCH #update' do
    let!(:item) { create(:text_item, add_editors: [user]) }
    let(:path) { "/api/v1/items/#{item.id}" }
    let(:params) {
      json_api_params(
        'items',
        {
          content: 'The wheels on the bus...'
        }
      )
    }

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('item')
    end

    it 'updates the content' do
      expect(item.content).not_to eq('The wheels on the bus...')
      patch(path, params: params)
      expect(item.reload.content).to eq('The wheels on the bus...')
    end
  end

  describe 'POST #duplicate' do
    let!(:item) { create(:text_item, add_editors: [user]) }
    let(:path) { "/api/v1/items/#{item.id}/duplicate" }

    it 'returns a 200' do
      post(path)
      expect(response.status).to eq(200)
    end

    it 'creates new item' do
      expect { post(path) }.to change(Item, :count).by(1)
    end

    it 'returns new item' do
      post(path)
      expect(json['data']['attributes']['id']).not_to eq(item.id)
    end
  end
end
