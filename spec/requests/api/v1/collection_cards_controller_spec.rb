require 'rails_helper'

describe Api::V1::CollectionCardsController, type: :request, json: true, auth: true do
  let(:user) { @user }
  let(:organization) { create(:organization_without_groups) }
  let(:collection) do
    create(:collection, add_editors: [user], organization: organization)
  end
  let(:subcollection) do
    create(:collection, add_editors: [user], organization: organization)
  end

  before do
    user.reload
  end

  describe 'GET #index' do
    let!(:collection) { create(:collection, num_cards: 5, add_editors: [user]) }
    let(:path) { "/api/v1/collections/#{collection.id}/collection_cards" }

    before do
      collection.items.each { |i| user.add_role(Role::VIEWER, i) }
    end

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

  describe 'POST #create' do
    let(:path) { '/api/v1/collection_cards' }
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
      json_api_params('collection_cards', raw_params.reject { |k| k == :item_attributes })
    end

    context 'without content editor access' do
      let(:user) { create(:user, add_to_org: create(:organization)) }

      it 'returns a 401' do
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'success' do
      let(:collection) do
        create(:collection, add_content_editors: [user], organization: organization)
      end

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'creates record' do
        expect do
          post(path, params: params)
        end.to change(Item, :count).by(1)
      end

      it 'matches JSON schema' do
        post(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('collection_card')
      end

      it 'has collection as parent' do
        post(path, params: params)
        expect(CollectionCard.find(json['data']['id']).parent).to eq(collection)
      end

      it 'creates an activity' do
        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          actor: user,
          target: anything,
          action: :created,
          subject_user_ids: [user.id],
          subject_group_ids: [],
          source: nil,
          destination: nil,
        )
        post(path, params: params)
      end

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(
          collection,
          user,
        )
        post(path, params: params)
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
      let(:params_with_filestack_file) do
        json_api_params(
          'collection_cards',
          'order': 1,
          'width': 3,
          'height': 1,
          # parent_id is required to retrieve the parent collection without a nested route
          'parent_id': collection.id,
          'item_attributes': {
            'type': 'Item::FileItem',
            'filestack_file_attributes': {
              'url': filestack_file.url,
              'handle': filestack_file.handle,
              'size': filestack_file.size,
              'mimetype': filestack_file.mimetype,
              'filename': filename,
            },
          },
        )
      end

      it 'returns a 200' do
        post(path, params: params_with_filestack_file)
        expect(response.status).to eq(200)
      end

      it 'creates record' do
        expect do
          post(path, params: params_with_filestack_file)
        end.to change(FilestackFile, :count).by(1)
      end

      it 'has filename without extension as name' do
        post(path, params: params_with_filestack_file)
        item = json_included_objects_of_type('items').first
        expect(item['attributes']['name']).to eq('apple')
      end
    end

    context 'with video url attributes' do
      let(:filename) { 'apple.jpg' }
      let(:params_with_video_item) do
        json_api_params(
          'collection_cards',
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
        )
      end

      it 'returns a 200' do
        post(path, params: params_with_video_item)
        expect(response.status).to eq(200)
      end

      it 'creates video item' do
        expect do
          post(path, params: params_with_video_item)
        end.to change(Item::VideoItem, :count).by(1)
      end

      it 'returns item with given video url' do
        post(path, params: params_with_video_item)
        item = json_included_objects_of_type('items').first
        expect(item['attributes']['url']).to eq('https://www.youtube.com/watch?v=4r7wHMg5Yjg')
      end
    end
  end

  describe 'PATCH #archive' do
    let!(:collection_cards) { create_list(:collection_card_collection, 3, parent: collection) }
    let(:path) { '/api/v1/collection_cards/archive' }
    let(:params) { { card_ids: collection_cards.map(&:id) }.to_json }

    context 'with record edit access' do
      before do
        collection_cards.each do |card|
          user.add_role(Role::EDITOR, card.collection)
        end
      end

      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'archives the cards' do
        expect {
          patch(path, params: params)
        }.to change(CollectionCard.active, :count).by(-3)
      end

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(
          collection,
          user,
        )
        patch(path, params: params)
      end
    end

    context 'without record edit access' do
      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end
  end

  describe 'PATCH #unarchive' do
    let!(:collection_cards) { create_list(:collection_card_collection, 3, parent: collection) }
    let(:path) { '/api/v1/collection_cards/unarchive' }
    let(:raw_params) do
      {
        card_ids: collection_cards.map(&:id),
        collection_snapshot: {
          id: collection.id,
          attributes: {
            collection_cards_attributes: collection_cards.map do |card|
              { id: card.id, order: 0, width: 2, height: 1 }
            end,
          },
        },
      }
    end
    let(:params) { raw_params.to_json }

    context 'with record edit access' do
      before do
        collection_cards.each do |card|
          user.add_role(Role::EDITOR, card.collection)
        end
        allow(Collection).to receive(:find).and_return(collection)
      end

      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'calls unarchive_cards on the collection' do
        expect(collection).to receive(:unarchive_cards!)
        patch(path, params: params)
      end

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(
          collection,
          user,
        )
        patch(path, params: params)
      end
    end

    context 'without record edit access' do
      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end
  end

  describe 'PATCH #move' do
    let!(:from_collection) do
      create(:collection, organization: to_collection.organization, num_cards: 3, add_editors: [user])
    end
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

    context 'without content editor access for to_collection' do
      let(:to_collection) { create(:collection) }

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with content editor access for to_collection' do
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

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:call).twice
        patch(path, params: params)
      end

      it 'creates an activity' do
        expect(ActivityAndNotificationBuilder).to receive(:call).twice
        patch(path, params: params)
      end
    end
  end

  describe 'POST #link' do
    let!(:from_collection) { create(:collection, num_cards: 3, add_editors: [user]) }
    let!(:moving_cards) { from_collection.collection_cards.first(2) }
    let!(:unmoved_card) { from_collection.collection_cards.last }
    let(:path) { '/api/v1/collection_cards/link' }
    let(:raw_params) do
      {
        from_id: from_collection.id,
        to_id: to_collection.id,
        collection_card_ids: moving_cards.map(&:id),
        placement: 'beginning',
      }
    end
    let(:params) { raw_params.to_json }

    context 'without content editor access for to_collection' do
      let(:to_collection) { create(:collection) }

      it 'returns a 401' do
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'without view access for cards in from_collection' do
      let(:to_collection) do
        create(:collection, num_cards: 3, add_editors: [user])
      end

      it 'returns a 401' do
        # by default user won't have any role added to the records within the cards
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with content editor access for to_collection and view access for cards in from_collection' do
      let(:editor) { create(:user) }
      let(:viewer) { create(:user) }
      let(:to_collection) do
        create(:collection, num_cards: 3, add_editors: [user, editor], add_viewers: [viewer])
      end

      before do
        # user has to have access to each card's record in order to link them
        moving_cards.each do |card|
          user.add_role(Role::VIEWER, card.record)
        end
      end

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'links cards from one collection to the other' do
        expect(moving_cards.map(&:parent_id).uniq).to match_array [from_collection.id]
        post(path, params: params)
        # newly linked cards should link to the original moving_cards' items
        expect(to_collection.collection_cards.first(2).map(&:item)).to match_array moving_cards.map(&:item)
        expect(to_collection.collection_cards.first.link?).to be true
      end

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(
          to_collection,
          user,
        )
        post(path, params: params)
      end
    end
  end

  describe 'POST #duplicate' do
    let!(:from_collection) { create(:collection, num_cards: 3, add_editors: [user]) }
    let!(:moving_cards) { from_collection.collection_cards.first(2) }
    let!(:unmoved_card) { from_collection.collection_cards.last }
    let(:path) { '/api/v1/collection_cards/duplicate' }
    let(:raw_params) do
      {
        from_id: from_collection.id,
        to_id: to_collection.id,
        collection_card_ids: moving_cards.map(&:id),
        placement: 'beginning',
      }
    end
    let(:params) { raw_params.to_json }

    context 'without content editor access for to_collection' do
      let(:to_collection) { create(:collection) }

      it 'returns a 401' do
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'without view access for cards in from_collection' do
      let(:to_collection) do
        create(:collection, num_cards: 3, add_editors: [user])
      end

      it 'returns a 401' do
        # by default user won't have any role added to the records within the cards
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'trying to duplicate inside of itself' do
      let(:from_collection) { create(:collection, add_editors: [user]) }
      let(:parent_card) { create(:collection_card, collection: from_collection) }
      let(:moving_cards) { [parent_card] }
      let(:to_collection) { create(:collection, add_editors: [user], parent_collection: from_collection) }

      before do
        from_collection.recalculate_breadcrumb!
        to_collection.recalculate_breadcrumb!
      end

      it 'returns a 400' do
        post(path, params: params)
        expect(response.status).to eq(400)
      end
    end

    context 'with content editor access for to_collection and view access for cards in from_collection' do
      let(:editor) { create(:user) }
      let(:viewer) { create(:user) }
      let(:to_collection) do
        create(:collection, num_cards: 3, add_editors: [user, editor], add_viewers: [viewer])
      end

      before do
        # user has to have access to each card's record in order to link them
        moving_cards.each do |card|
          user.add_role(Role::VIEWER, card.record)
        end
      end

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'duplicates cards from one collection to the other' do
        expect(moving_cards.map(&:parent_id).uniq).to match_array [from_collection.id]
        post(path, params: params)
        # newly created cards should be duplicates
        first_cards = to_collection.collection_cards.first(2)
        expect(first_cards.map(&:item)).not_to match_array moving_cards.map(&:item)
        # names should match, in same order
        expect(first_cards.map(&:item).map(&:name)).to eq moving_cards.map(&:item).map(&:name)
        expect(to_collection.collection_cards.first.primary?).to be true
      end

      it 'calls reorder_cards! to make sure card orders are not wacky' do
        expect_any_instance_of(Collection).to receive(:reorder_cards!)
        post(path, params: params)
      end
    end
  end

  describe 'PATCH #update' do
    let(:collection) { create(:collection, organization: organization) }
    let(:collection_card) { create(:collection_card_text, parent: collection) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}" }
    let(:raw_params) do
      {
        image_contain: true,
      }
    end
    let(:params) { json_api_params('collection_cards', raw_params) }

    before do
      user.add_role(Role::EDITOR, collection_card.item)
      user.add_role(Role::EDITOR, collection)
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('collection_card')
      expect(json['data']['attributes']['parent_id']).to eq collection.id
    end

    it 'updates the card, such as the image_contain property' do
      patch(path, params: params)
      expect(json['data']['attributes']['image_contain']).to eq true
      expect(collection_card.reload.image_contain).to be true
    end

    it 'broadcasts collection updates' do
      expect(CollectionUpdateBroadcaster).to receive(:call).with(
        collection,
        user,
      )
      patch(path, params: params)
    end

    context 'without content editor access on the parent collection' do
      let(:user) { create(:user, add_to_org: create(:organization)) }

      before do
        user.add_role(Role::EDITOR, collection_card.item)
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end
  end

  describe 'PATCH #replace' do
    let(:collection) { create(:collection, organization: organization) }
    let(:collection_card) { create(:collection_card_text, parent: collection) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}/replace" }
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

    context 'with record and collection content edit access' do
      before do
        user.add_role(Role::CONTENT_EDITOR, collection_card.item)
        user.add_role(Role::CONTENT_EDITOR, collection)
      end

      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'matches JSON schema' do
        patch(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('collection_card')
        expect(json['data']['attributes']['parent_id']).to eq collection.id
      end

      it 'archives the existing card' do
        expect(collection_card.archived).to eq(false)
        patch(path, params: params)
        expect(collection_card.reload.archived).to eq(true)
      end

      it 'creates a new item' do
        expect do
          patch(path, params: params)
        end.to change(Item, :count).by(1)
      end

      it 'creates an activity' do
        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          actor: user,
          target: anything,
          action: :replaced,
          subject_user_ids: [user.id],
          subject_group_ids: [],
          source: nil,
          destination: nil,
        )
        patch(path, params: params)
      end

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(
          collection,
          user,
        )
        patch(path, params: params)
      end

      context 'with question item params' do
        let(:collection) { create(:test_collection, organization: organization) }
        let(:raw_params) do
          {
            order: 2,
            # parent_id is required to retrieve the parent collection without a nested route
            parent_id: collection.id,
            # create with a nested item
            item_attributes: {
              type: 'Item::QuestionItem',
              content: 'This is my item content',
              question_type: :question_description,
            },
          }
        end

        it 'creates a QuestionItem card' do
          expect do
            patch(path, params: params)
          end.to change(Item::QuestionItem, :count).by(1)
          expect(json['data']['attributes']['card_question_type']).to eq 'question_description'
        end
      end
    end

    context 'without record edit access' do
      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end
  end
end
