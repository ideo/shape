require 'rails_helper'

def remove_access(collection_cards, user)
  collection_cards.each do |card|
    card.record.unanchor_and_inherit_roles_from_anchor!
    user.remove_role(Role::EDITOR, card.record)
    user.remove_role(Role::VIEWER, card.record)
  end
end

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
      expect(json['data'].count).to eq 5
      expect(json['data'].map { |cc| cc['id'].to_i }).to match_array(collection.collection_card_ids)
    end

    describe 'included' do
      let(:items_json) { json_included_objects_of_type('items') }

      before do
        collection.items.each { |item| user.add_role(Role::VIEWER, item) }
      end

      it 'returns all items' do
        get(path)
        expect(items_json.map { |i| i['id'].to_i }).to match_array(collection.item_ids)
      end

      it 'matches Item schema' do
        get(path)
        expect(items_json.first['attributes']).to match_json_schema('item', strict: false)
      end
    end

    context 'with permissions' do
      before do
        collection.items.last.unanchor_and_inherit_roles_from_anchor!
        user.remove_role(Role::VIEWER, collection.items.last)
      end

      it 'only shows items viewable by the user' do
        get(path)
        expect(json['data'].count).to eq 4
      end
    end

    context 'with nested collection' do
      let!(:nested_collection) { create(:collection, add_editors: [user]) }
      let!(:nested_card) do
        create(:collection_card_collection,
               parent: collection,
               collection: nested_collection)
      end
      let(:collections_json) { json_included_objects_of_type('collections') }

      it 'returns nested Collection' do
        get(path)
        expect(collections_json.map { |c| c['id'].to_i }).to include(nested_collection.id)
      end

      it 'matches Collection schema' do
        get(path)
        expect(collections_json.first['attributes']).to match_json_schema('collection', strict: false)
      end
    end

    context 'with pagination options' do
      let(:path) { "/api/v1/collections/#{collection.id}/collection_cards?per_page=2&page=2" }

      before do
        Kernel.silence_warnings do
          # it uses this as a minimum so we change it here, otherwise we'd need 50+ cards to test
          CollectionCard::DEFAULT_PER_PAGE = 2
        end
      end

      after do
        Kernel.silence_warnings do
          CollectionCard::DEFAULT_PER_PAGE = 50
        end
      end

      it 'includes only the correct page of collection cards' do
        get(path)
        # should be the second page of 2 cards
        expect(json['data'].map { |cc| cc['id'].to_i }).to match_array(collection.collection_card_ids.slice(2, 2))
      end
    end

    context 'with hidden options' do
      before do
        collection.collection_cards.last.update(hidden: true)
      end

      it 'should omit hidden cards by default' do
        get(path)
        expect(json['data'].count).to eq 4
      end

      context 'with hidden = true' do
        let(:path) { "/api/v1/collections/#{collection.id}/collection_cards?hidden=true" }

        it 'should include hidden cards' do
          get(path)
          expect(json['data'].count).to eq 5
        end
      end
    end

    context 'with sort options' do
      let(:path) { "/api/v1/collections/#{collection.id}/collection_cards?card_order=updated_at" }
      let(:collection_json) do
        json['included'].select { |c| c['id'].to_i == collection.id }.first
      end

      it 'should sort by the passed in card_order param' do
        get(path)
        expect(collection_json['attributes']['card_order']).to eq 'updated_at'
        cards = json['data']
        # kind of a hacky way to say that the first card is "newer" than the second
        expect(cards.first['id'] > cards.second['id']).to be true
      end

      context 'with SharedWithMeCollection' do
        let!(:collection) do
          create(:shared_with_me_collection, num_cards: 5, add_viewers: [user])
        end

        before do
          collection.collection_cards.each do |cc|
            user.add_role(Role::VIEWER, cc.record)
          end
        end

        it 'should sort by updated_at by default' do
          get(path)
          expect(collection_json['attributes']['card_order']).to eq 'updated_at'
        end
      end
    end
  end

  describe 'POST #create' do
    let(:path) { '/api/v1/collection_cards' }
    let(:item_attributes) do
      {
        content: 'This is my item content',
        data_content: { ops: [{ insert: 'This is my item content.' }] },
        type: 'Item::TextItem',
      }
    end
    let(:raw_params) do
      {
        order: 1,
        width: 3,
        height: 1,
        # parent_id is required to retrieve the parent collection without a nested route
        parent_id: collection.id,
        # create with a nested item
        item_attributes: item_attributes,
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
        create(:collection, add_editors: [user], organization: organization)
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

      context 'broadcasting updates' do
        context 'with a text item' do
          let(:item_attributes) do
            {
              content: '',
              data_content: {},
              type: 'Item::TextItem',
            }
          end

          it 'does not broadcast collection updates' do
            # text items get created empty so we don't broadcast yet
            expect(CollectionUpdateBroadcaster).not_to receive(:call)
            post(path, params: params)
          end
        end

        context 'with a link item' do
          let(:item_attributes) do
            {
              content: 'This is my item content',
              url: Faker::Internet.url('example.com'),
              type: 'Item::LinkItem',
            }
          end

          it 'broadcasts collection updates' do
            expect(CollectionUpdateBroadcaster).to receive(:call).with(
              collection,
              user,
            )
            post(path, params: params)
          end
        end
      end
    end

    context 'with errors' do
      it 'returns a 422 bad request' do
        post(path, params: bad_params)
        expect(response.status).to eq(422)
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

    context 'without record edit access' do
      before do
        remove_access(collection_cards, user)
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    # record access automatically inherited
    context 'with record edit access' do
      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'archives the cards' do
        expect do
          patch(path, params: params)
        end.to change(CollectionCard.active, :count).by(-3)
      end

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(
          collection,
          user,
        )
        patch(path, params: params)
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

    context 'without record edit access' do
      before do
        remove_access(collection_cards, user)
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with record edit access' do
      before do
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

    context 'trying to move inside itself' do
      let!(:from_collection) do
        create(:collection, organization: to_collection.organization, add_editors: [user])
      end
      let!(:subcollection_card) { create(:collection_card, parent: from_collection) }
      let!(:to_collection) { create(:collection, add_editors: [user]) }
      let(:moving_cards) { [subcollection_card] }

      before do
        to_collection.update(
          parent_collection_card: subcollection_card,
        )
        user.add_role(Role::EDITOR, to_collection)
      end

      it 'returns a 422 unprocessable_entity' do
        patch(path, params: params)
        expect(response.status).to eq(422)
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
        # expect to find moved cards at the front
        expect(combined_cards.first(2)).to eq moving_cards
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

      context 'with specific order' do
        before do
          moving_cards.first.update(order: 1)
          moving_cards.last.update(order: 0)
        end

        it 'moves new cards to the front of the collection and preserves order' do
          patch(path, params: params)
          combined_cards = to_collection.reload.collection_cards
          expect(combined_cards.first).to eq moving_cards.last
        end
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

      before do
        remove_access(from_collection.collection_cards, user)
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

      before do
        remove_access(from_collection.collection_cards, user)
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

      it 'returns a 422' do
        post(path, params: params)
        expect(response.status).to eq(422)
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
        expect(first_cards.map(&:item).map(&:name)).to match_array moving_cards.map(&:item).map(&:name)
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

    it 'creates an activity' do
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: user,
        target: anything,
        action: :edited,
        subject_user_ids: [user.id],
        subject_group_ids: [],
        source: nil,
        destination: nil,
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
    let(:collection_card) { create(:collection_card_image, parent: collection) }
    let(:item) { collection_card.item }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}/replace" }
    let(:editor) { create(:user) }
    let(:raw_params) do
      {
        order: 1,
        width: 3,
        height: 1,
        # parent_id is required to retrieve the parent collection without a nested route
        parent_id: collection.id,
        # create with a nested item
        item_attributes: {
          type: 'Item::LinkItem',
          url: 'http://item.link.url.net/123',
          name: 'A linkable linked article',
          content: 'Some text that would go inside, lorem ipsum.',
          icon_url: 'http://icon.url',
        },
      }
    end
    let(:params) { json_api_params('collection_cards', raw_params) }

    context 'with record and collection content edit access' do
      before do
        editor.add_role(Role::EDITOR, collection_card.item)
        editor.add_role(Role::EDITOR, collection)
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

      it 'updates the existing item with the new type' do
        expect(item.is_a?(Item::FileItem)).to be true
        expect(item.filestack_file.present?).to be true
        expect do
          patch(path, params: params)
        end.not_to change(Item, :count)
        # have to refetch since it's now a new model type
        id = item.id
        item = Item.find(id)
        expect(item.is_a?(Item::LinkItem)).to be true
        # should clear any previous attrs
        expect(item.filestack_file.present?).to be false
      end

      it 'preserves the roles' do
        expect(item.can_edit?(editor)).to be true
        expect(item.can_edit_content?(user)).to be true
        patch(path, params: params)
        expect(item.can_edit?(editor)).to be true
        expect(item.can_edit_content?(user)).to be true
      end

      it 'creates an activity' do
        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          actor: user,
          target: anything,
          action: :replaced,
          subject_user_ids: [editor.id],
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
        # will be question_useful by default
        let(:collection_card) { create(:collection_card_question, parent: collection) }
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

        it 'replaces the QuestionItem' do
          expect do
            patch(path, params: params)
          end.not_to change(Item::QuestionItem, :count)
          expect(json['data']['attributes']['card_question_type']).to eq 'question_description'
        end
      end
    end

    context 'without record edit access' do
      before do
        remove_access([collection_card], user)
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end
  end
end
