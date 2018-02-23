require 'rails_helper'

describe Api::V1::CollectionsController, type: :request, auth: true do
  describe 'GET #index' do
    let(:user) { @user }
    let!(:organization) { create(:organization, member: @user) }
    let!(:collections_in_org) { create_list(:collection, 3, organization: organization) }
    let!(:collections_outside_org) { create_list(:collection, 3) }
    let(:path) { "/api/v1/collections" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data'].first['attributes']).to match_json_schema('collection')
    end

    it 'should return all collections in the org' do
      get(path)
      expect(json['data'].map { |c| c['id'].to_i }).to match_array(collections_in_org.map(&:id))
    end
  end

  describe 'GET #show' do
    let!(:collection) {
      create(:collection, num_cards: 5)
    }
    let(:path) { "/api/v1/collections/#{collection.id}" }
    let(:user) { @user }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('collection')
    end

    it 'should include breadcrumb' do
      user.add_role(Role::VIEWER, collection)
      collection.reload
      collection.recalculate_breadcrumb!
      get(path)
      expect(json['data']['attributes']['breadcrumb']).to match_array([
        ['collections', collection.id, collection.name]
      ])
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

  describe 'GET #me' do
    let(:user) { @user }
    let!(:organization) { create(:organization, member: user) }
    let!(:org_2) { create(:organization, member: user) }
    let(:path) { '/api/v1/collections/me' }
    let(:user_collection) { user.collections.user.where(organization_id: organization.id).first }
    let(:shared_with_me_collection) { user_collection.collections.shared_with_me.first }
    let(:collection_cards_json) { json_included_objects_of_type('collection_cards') }
    let(:collections_json) { json_included_objects_of_type('collections') }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns their user collection for this org' do
      get(path)
      expect(json['data']['attributes']['id']).to eq(user_collection.id)
    end

    it 'includes the shared-with-me subcollection' do
      get(path)
      expect(collections_json.first['id'].to_i).to eq(shared_with_me_collection.id)
    end
  end

  describe 'POST #create' do
    let!(:organization) { create(:organization) }
    let(:path) { "/api/v1/organizations/#{organization.id}/collections" }
    let(:params) {
      json_api_params(
        'collections',
        {
          'name': 'What a wonderful life'
        }
      )
    }

    context 'success' do
      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'matches Collection schema' do
        post(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('collection')
      end
    end

    context 'with errors' do
      let(:path) { "/api/v1/collections" }

      it 'returns a 400' do
        # because of the new path, will get an "organization can't be blank" error
        post(path, params: params)
        expect(response.status).to eq(400)
      end
    end

    context 'as sub-collection' do
      let!(:collection) { create(:collection, organization: organization) }
      let!(:collection_card) { create(:collection_card, parent: collection) }
      let(:path) { "/api/v1/collection_cards/#{collection_card.id}/collections" }

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'has collection as parent' do
        post(path, params: params)
        id = json['data']['attributes']['id']
        expect(Collection.find(id).parent).to eq(collection)
      end
    end
  end

  describe 'PATCH #update' do
    let!(:collection) { create(:collection) }
    let(:path) { "/api/v1/collections/#{collection.id}" }
    let(:params) {
      json_api_params(
        'collections',
        {
          'id': collection.id,
          'name': 'Who let the dogs out?',
        }
      )
    }

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches Collection schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('collection')
    end

    it 'updates the name' do
      expect(collection.name).not_to eq('Who let the dogs out?')
      patch(path, params: params)
      expect(collection.reload.name).to eq('Who let the dogs out?')
    end
  end
end
