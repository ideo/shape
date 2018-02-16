require 'rails_helper'

describe Api::V1::ItemsController, type: :request, auth: true do
  describe 'GET #show' do
    let!(:item) { create(:text_item) }
    let(:path) { "/api/v1/items/#{item.id}" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('item')
    end

    context 'with parents' do
      let!(:collection) { create(:collection) }
      let!(:collection_card) { create(:collection_card_item, parent: collection) }
      let!(:item) { collection_card.item }
      let(:user) { @user }

      before do
        item.reload
        item.recalculate_breadcrumb!
      end

      it 'returns empty breadcrumb' do
        get(path)
        expect(json['data']['attributes']['breadcrumb']).to be_empty
      end

      it 'returns full breadcrumb if user has access' do
        user.add_role(Role::VIEWER, collection)
        get(path)
        expect(json['data']['attributes']['breadcrumb']).to match_array([
          [Role.object_identifier(collection), collection.name],
          [Role.object_identifier(item), item.name]
        ])
      end
    end
  end

  describe 'POST #create' do
    let!(:collection_card) { create(:collection_card) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}/items" }
    let(:params) {
      json_api_params(
        'items',
        {
          'type': 'Item::TextItem',
          'content': 'A is for Apples'
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
    let!(:item) { create(:text_item) }
    let(:path) { "/api/v1/items/#{item.id}" }
    let(:params) {
      json_api_params(
        'items',
        {
          'content': 'The wheels on the bus...'
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
end
