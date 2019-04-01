require 'rails_helper'

describe Api::V1::ItemsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'GET #index', api_token: true do
    let(:path) { '/api/v1/items' }

    # these index actions are essentially testing Collection::FilteredIndexLoader
    it 'returns a 422 unless filter param is present' do
      get(path)
      expect(response.status).to eq(422)
    end

    it 'returns a 200 if filter param and api_token are present' do
      get(path, params: { filter: { external_id: '99' } })
      expect(response.status).to eq(200)
    end

    context 'with api token and external_id', auth: false do
      let(:item) { create(:text_item) }
      let!(:external_record) do
        create(:external_record, external_id: '99', externalizable: item, application: @api_token.application)
      end

      it 'returns the item with external_id' do
        get(
          path,
          params: { filter: { external_id: '99' } },
          headers: { Authorization: "Bearer #{@api_token.token}" },
        )
        expect(response.status).to eq(200)
        expect(json['data'].count).to eq 1
        expect(json['data'].first['attributes']['external_id']).to eq '99'
      end
    end
  end

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

    it 'creates an activity for viewing the item' do
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: @user,
        target: item,
        action: :viewed,
        content: anything,
      )
      get(path)
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
      let!(:collection_card) { create(:collection_card_text, parent: collection) }
      let!(:item) { collection_card.item }

      before do
        item.unanchor!
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
          { 'type' => 'collections', 'id' => collection.id, 'name' => collection.name, 'can_edit' => false },
          { 'type' => 'items', 'id' => item.id, 'name' => item.name, 'can_edit' => false },
        ])
      end
    end
  end

  describe 'PATCH #update' do
    let!(:item) { create(:text_item, add_editors: [user]) }
    let!(:parent) { create(:collection) }
    let!(:parent_collection_card) do
      create(:collection_card_text, item: item, parent: parent)
    end
    let(:path) { "/api/v1/items/#{item.id}" }
    let(:params) do
      json_api_params(
        'items',
        content: 'The wheels on the bus...',
        data_settings: {
          d_measure: 'participants',
          d_timeframe: 'ever',
          d_filters: [{ type: 'Collection', target: 1 }],
        },
      )
    end
    let(:broadcaster) { double('broadcaster') }

    before do
      allow(CollectionUpdateBroadcaster).to receive(:new).and_return(broadcaster)
      allow(broadcaster).to receive(:text_item_updated).and_return(true)
      allow(broadcaster).to receive(:call).and_return(true)
    end

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

    it 'updates the data_settings' do
      expect(item.data_settings).not_to eq(
        'd_measure' => 'participants',
        'd_timeframe' => 'ever',
        'd_filters' => [{ 'type' => 'Collection', 'target' => 1 }],
      )
      patch(path, params: params)
      expect(item.reload.data_settings).to eq(
        'd_measure' => 'participants',
        'd_timeframe' => 'ever',
        'd_filters' => [{ 'type' => 'Collection', 'target' => 1 }],
      )
    end

    it 'touches the parent (after_commit)' do
      patch(path, params: params)
      parent.reload
      expect(parent.updated_at).to be > parent.created_at
    end

    it 'creates an activity' do
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: @user,
        target: item,
        action: :edited,
        content: anything,
      )
      patch(path, params: params)
    end

    context 'with a text item' do
      let!(:item) { create(:text_item, add_editors: [user]) }

      it 'broadcasts individual text updates' do
        expect(broadcaster).to receive(:text_item_updated).with(
          item,
        )
        patch(path, params: params)
      end
    end

    context 'with a link item' do
      let!(:item) { create(:link_item, add_editors: [user]) }

      it 'broadcasts collection updates' do
        expect(broadcaster).to receive(:call)
        patch(path, params: params)
      end
    end

    context 'with cancel_sync == true' do
      let(:params) do
        json_api_params(
          'items',
          { content: 'The wheels on the bus...' },
          cancel_sync: true,
        )
      end

      it 'returns a 204 no content' do
        patch(path, params: params)
        expect(response.status).to eq(204)
      end
    end
  end

  describe 'POST #duplicate', create_org: true do
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

  describe 'PATCH #restore_permissions' do
    let!(:collection) { create(:collection) }
    let(:path) { "/api/v1/items/#{item.id}/restore_permissions" }

    context 'without edit access to the item' do
      let!(:item) { create(:text_item, parent_collection: collection) }

      it 'returns a 401' do
        patch(path)
        expect(response.status).to eq(401)
      end
    end

    context 'with edit access to the item' do
      let!(:item) { create(:text_item, add_editors: [user], parent_collection: collection) }

      it 'returns a 200' do
        patch(path)
        expect(response.status).to eq(200)
      end

      it 'calls Roles::MergeToChild' do
        expect(Roles::MergeToChild).to receive(:call).with(
          parent: item.parent,
          child: item,
        )
        patch(path)
      end
    end
  end
end
