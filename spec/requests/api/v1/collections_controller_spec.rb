require 'rails_helper'

describe Api::V1::CollectionsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'GET #show' do
    let!(:collection) {
      create(:collection, num_cards: 5, add_viewers: [user])
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
        ['collections', collection.id, collection.name],
      ])
    end

    it 'has no editors' do
      get(path)
      roles = json['data']['relationships']['roles']['data']
      editor_role = roles.select { |role| role['name'] == 'editor' }
      expect(editor_role).to be_empty
    end

    it 'returns can_edit as false' do
      get(path)
      expect(json['data']['attributes']['can_edit']).to eq(false)
    end

    context 'with editor' do
      let!(:collection) {
        create(:collection, num_cards: 5, add_editors: [user])
      }

      it 'returns can_edit as true' do
        get(path)
        expect(json['data']['attributes']['can_edit']).to eq(true)
      end
    end

    describe 'included' do
      let(:collection_cards_json) { json_included_objects_of_type('collection_cards') }
      let(:items_json) { json_included_objects_of_type('items') }
      let(:users_json) { json_included_objects_of_type('users') }

      before do
        collection.items.each { |item| user.add_role(Role::VIEWER, item) }
      end

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

      it 'includes viewers' do
        get(path)
        expect(users_json.map { |u| u['id'].to_i }).to match_array([user.id])
      end

      context 'with editor' do
        let!(:collection) {
          create(:collection, num_cards: 5, add_editors: [user])
        }

        it 'includes only editors' do
          get(path)
          expect(users_json.map { |u| u['id'].to_i }).to match_array([user.id])
        end
      end
    end

    context 'with nested collection' do
      let!(:nested_collection) { create(:collection, add_editors: [user]) }
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

  describe 'POST #create' do
    let!(:organization) { create(:organization) }
    let(:path) { "/api/v1/organizations/#{organization.id}/collections" }
    let(:params) {
      json_api_params(
        'collections',
        name: 'What a wonderful life',
      )
    }

    before do
      user.add_role(Role::MEMBER, organization.primary_group)
    end

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
      let(:path) { '/api/v1/collections' }

      it 'returns a 400' do
        # because of the new path, will get an "organization can't be blank" error
        post(path, params: params)
        expect(response.status).to eq(400)
      end
    end
  end

  describe 'PATCH #update' do
    let!(:collection) { create(:collection, add_editors: [user]) }
    let(:collection_card) do
      create(:collection_card_text, order: 0, width: 1, parent: collection)
    end
    let(:path) { "/api/v1/collections/#{collection.id}" }
    let(:raw_params) {
      {
        id: collection.id,
        name: 'Who let the dogs out?',
        collection_cards_attributes: [
          {
            id: collection_card.id,
            order: 1,
            width: 3,
          },
        ],
      }
    }
    let(:params) {
      json_api_params(
        'collections',
        raw_params,
      )
    }

    before do
      user.add_role(Role::VIEWER, collection_card.item)
    end

    context 'as content editor' do
      before do
        user.remove_role(Role::EDITOR, collection)
        user.add_role(Role::CONTENT_EDITOR, collection)
      end

      context 'updating collection name on a system_required collection' do
        let(:collection) { create(:user_profile) }

        it 'returns a 401' do
          patch(path, params: params)
          expect(response.status).to eq(401)
        end
      end

      context 'updating collection cards attributes' do
        let(:raw_params) {
          {
            id: collection.id,
            collection_cards_attributes: [
              {
                id: collection_card.id,
                order: 1,
                width: 3,
              },
            ],
          }
        }

        it 'returns a 200' do
          patch(path, params: params)
          expect(response.status).to eq(200)
        end
      end
    end

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

    it 'updates the collection_card' do
      expect(collection_card.width).not_to eq(3)
      expect(collection_card.order).not_to eq(1)
      patch(path, params: params)
      expect(collection_card.reload.width).to eq(3)
      expect(collection_card.reload.order).to eq(1)
    end

    context 'with cancel_sync == true' do
      let(:params) {
        json_api_params(
          'collections',
          raw_params,
          cancel_sync: true,
        )
      }

      it 'returns a 204 no content' do
        patch(path, params: params)
        expect(response.status).to eq(204)
      end
    end
  end

  describe 'PATCH #archive' do
    let!(:collection) { create(:collection, add_editors: [user]) }
    # parent_collection_card is required to exist because it calls decrement_card_orders
    let!(:parent_collection_card) { create(:collection_card, collection: collection) }
    let(:collection_card) do
      create(:collection_card_text, order: 0, width: 1, parent: collection)
    end
    let(:path) { "/api/v1/collections/#{collection.id}/archive" }

    it 'returns a 200' do
      patch(path)
      expect(response.status).to eq(200)
    end

    it 'matches Collection schema' do
      patch(path)
      expect(json['data']['attributes']).to match_json_schema('collection')
    end

    it 'updates the archived status of the collection' do
      expect(collection.active?).to eq(true)
      patch(path)
      expect(collection.reload.archived?).to eq(true)
    end

    it 'updates the archived status of the collection_card' do
      expect(collection_card.active?).to eq(true)
      patch(path)
      expect(collection_card.reload.archived?).to eq(true)
    end

    it 'should call the activity and notification builder' do
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: @user,
        target: collection,
        action: Activity.actions[:archived],
        subject_user_ids: [user.id],
        subject_group_ids: [],
      )
      patch(path)
    end

    context 'without edit access' do
      before do
        user.remove_role(Role::EDITOR, collection)
        user.add_role(Role::CONTENT_EDITOR, collection)
      end

      it 'rejects non-editors' do
        patch(path)
        expect(response.status).to eq(401)
      end
    end
  end

  describe 'POST #duplicate' do
    let!(:collection) { create(:collection, add_editors: [user]) }
    let(:path) { "/api/v1/collections/#{collection.id}/duplicate" }

    it 'returns a 200' do
      post(path)
      expect(response.status).to eq(200)
    end

    it 'creates new collection' do
      expect { post(path) }.to change(Collection, :count).by(1)
    end

    it 'returns new collection' do
      post(path)
      expect(json['data']['attributes']['id']).not_to eq(collection.id)
    end
  end
end
