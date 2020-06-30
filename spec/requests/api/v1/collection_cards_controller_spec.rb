require 'rails_helper'
require './spec/services/collection_broadcaster_shared_setup'

def remove_access(collection_cards, user)
  collection_cards.each do |card|
    card.record.unanchor_and_inherit_roles_from_anchor!
    user.remove_role(Role::EDITOR, card.record)
    user.remove_role(Role::VIEWER, card.record)
  end
end

describe Api::V1::CollectionCardsController, type: :request, json: true, auth: true do
  include_context 'CollectionUpdateBroadcaster setup'
  let(:user) { @user }
  let(:organization) { create(:organization_without_groups) }
  let(:collection) do
    create(:collection, add_editors: [user], organization: organization)
  end
  let(:subcollection) do
    create(:collection, add_editors: [user], organization: organization)
  end

  before do
    user&.reload
    allow(ActivityAndNotificationForCardWorker).to receive(:perform_async).and_call_original
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

    it 'includes pagination info' do
      get(path)
      expect(json['links']).to eq({
        first: 1,
        last: 1,
        next: nil,
        prev: nil,
      }.as_json)
    end

    context 'with no user session and public collection', auth: false do
      # just so there is a user in context, but this user is not logged in
      let(:user) { create(:user) }
      let(:collection) { create(:collection, anyone_can_view: true) }

      it 'returns a 200' do
        get(path)
        expect(response.status).to eq(200)
      end
    end

    context 'on different org' do
      let(:first_org) { create(:organization, member: user) }
      let!(:other_org) { create(:organization, member: user) }
      let!(:collection) do
        create(:collection, organization: other_org, add_viewers: [user])
      end

      before do
        user.switch_to_organization(first_org)
      end

      it 'should switch the user to the org' do
        expect(user.current_organization).to eq first_org
        get(path)
        expect(response.status).to eq(200)
        expect(user.reload.current_organization).to eq other_org
      end
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
        # still shows all 5, however...
        expect(json['data'].count).to eq 5
        first_card = Mashie.new(json['data'].first)
        private_card = Mashie.new(json['data'].last)
        expect(first_card.attributes.private_card).to be nil
        expect(first_card.relationships.record.data.type).to eq 'items'
        # the last card is private and it does not include the record
        expect(private_card.attributes.private_card).to be true
        expect(private_card.relationships.record.meta.included).to be false
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
      before do
        collection.collection_cards.each_with_index do |card, i|
          card.update(updated_at: i.minutes.ago)
        end
      end

      it 'should sort by the passed in card_order param' do
        get(path)
        cards = json['data']
        sorted_cards = cards.sort_by { |c| c['attributes']['updated_at'] }.reverse
        expect(cards).to eq(sorted_cards)
      end
    end

    context 'with select_id options' do
      let(:last_3) { collection.collection_cards.last(3) }
      it 'only returns the selected ids' do
        get("#{path}?select_ids=#{last_3.map(&:id).join(',')}")
        expect(json['data'].count).to eq 3
        expect(json['data'].map { |cc| cc['id'].to_i }).to match_array(last_3.map(&:id))
      end
    end

    context 'with Board collection' do
      let!(:board_collection) do
        create(:board_collection, num_cards: 4, add_editors: [user])
      end
      let(:board_collection_cards) { board_collection.collection_cards }
      let(:path) do
        "/api/v1/collections/#{board_collection.id}/collection_cards?rows[]=2&rows[]=4&cols[]=0&cols[]=2"
      end
      let!(:cards_included) do
        board_collection_cards[0].update(row: 2, col: 0)
        board_collection_cards[1].update(row: 4, col: 2)
        [
          board_collection_cards[0],
          board_collection_cards[1],
        ]
      end
      let!(:cards_excluded) do
        board_collection_cards[2].update(row: 0, col: 0)
        board_collection_cards[3].update(row: 2, col: 3)
        [
          board_collection_cards[2],
          board_collection_cards[3],
        ]
      end
      before do
        board_collection.items.each { |i| user.add_role(Role::VIEWER, i) }
      end

      it 'includes cards with requested rows and columns' do
        get(path)
        expect(
          json['data'].map { |card| card['id'].to_i },
        ).to match_array(cards_included.map(&:id))
      end
    end
  end

  describe 'GET #ids' do
    let!(:collection) { create(:collection, num_cards: 5, add_editors: [user]) }
    let(:path) { "/api/v1/collections/#{collection.id}/collection_cards/ids" }

    it 'returns id, order, row, col of collection.collection_cards' do
      get(path)
      expect(response.status).to eq(200)
      expect(json.length).to eq(5)
      data = collection.collection_cards.map do |cc|
        {
          id: cc.id.to_s,
          order: cc.order,
          row: cc.row,
          col: cc.col,
        }
      end
      expect(json).to eq data.as_json
    end
  end

  describe 'GET #roles' do
    let!(:collection) { create(:collection, num_cards: 5, add_editors: [user]) }
    let(:items) { collection.items }
    let(:path) { "/api/v1/collections/#{collection.id}/collection_cards/roles" }
    before do
      items.first.reload.unanchor_and_inherit_roles_from_anchor!
    end

    it 'returns cards with their related roles' do
      get(path)
      expect(response.status).to eq(200)
      expect(json['data'].length).to eq(5)
      expect(json['data'].first['relationships']['record']['data']['id']).to eq(
        items.first.id.to_s,
      )
      # 1 role for the collection, 1 for the unanchored item
      expect(json['included'].select { |i| i['type'] == 'roles' }.count).to eq 2
    end
  end

  describe 'GET #ids_in_direction' do
    let!(:collection) { create(:board_collection, num_cards: 5, add_editors: [user]) }
    let(:path) { "/api/v1/collections/#{collection.id}/collection_cards/ids_in_direction" }
    let(:direction) { 'bottom' }
    let(:card_id) { collection.collection_cards.first.id }
    let(:params) do
      {
        direction: direction,
        collection_card_id: card_id,
      }
    end

    it 'returns stringified ids of selected cards at the bottom' do
      get(path, params: params)
      expect(response.status).to eq(200)
      expect(json.length).to eq(5)
      # FIXME: should be the cards at the bottom
      expect(json).to eq(collection.collection_cards.pluck(:id).map(&:to_s))
    end
  end

  describe 'GET #breadcrumb_records' do
    let!(:collection) { create(:collection, record_type: :collection, num_cards: 5, add_editors: [user]) }
    let(:path) { "/api/v1/collections/#{collection.id}/collection_cards/breadcrumb_records" }

    it 'returns breadcrumb json data of collection_cards' do
      get(path)
      expect(response.status).to eq(200)
      expect(json.length).to eq(5)
      expect(json.pluck('id')).to eq(collection.collection_cards.map(&:record).pluck(:id))
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
        post(path, params: params)
        expect(ActivityAndNotificationForCardWorker).to have_received(:perform_async).with(
          user.id,
          json['data']['id'].to_i,
          :created,
          nil,
          nil,
        )
      end

      context 'with a collection' do
        let(:raw_params) do
          {
            order: 1,
            width: 1,
            height: 1,
            parent_id: collection.id,
            # create with a nested item
            collection_attributes: {
              name: 'My Board',
              type: 'Collection::Board',
              num_columns: 4,
            },
          }
        end

        it 'creates record' do
          expect do
            post(path, params: params)
          end.to change(Collection::Board, :count).by(1)
          card = CollectionCard.find(json['data']['id'])
          expect(card.record.num_columns).to eq 4
        end
      end

      context 'with a link card' do
        let!(:linked_collection) { create(:collection) }
        let(:raw_params) do
          {
            order: 1,
            parent_id: collection.id,
            collection_id: linked_collection.id,
            card_type: 'link',
          }
        end

        it 'should create a link card' do
          post(path, params: params)
          expect(CollectionCard.find(json['data']['id']).parent).to eq(collection)
          linked_id = json['data']['relationships']['record']['data']['id']
          expect(Collection.find(linked_id)).to eq linked_collection
        end
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

          it 'broadcasts collection updates' do
            post(path, params: params)
            card = CollectionCard.find(json['data']['id'])
            expect(broadcaster_instance).to have_received(:card_updated).with(
              card,
            )
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
            post(path, params: params)
            card = CollectionCard.find(json['data']['id'])
            expect(broadcaster_instance).to have_received(:card_updated).with(
              card,
            )
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

    context 'with translated attributes' do
      let(:params_with_translated_attrs) do
        json_api_params(
          'collection_cards',
          order: 1,
          parent_id: collection.id,
          item_attributes: {
            type: 'Item::TextItem',
            name: 'Something great',
            translated_name_es: 'Algo genial',
            content: "Isn't this a cool widget?",
            translated_content_es: '¿No es este un widget genial?',
          },
        )
      end

      it 'returns a 200' do
        post(path, params: params_with_translated_attrs)
        expect(response.status).to eq(200)
      end

      it 'returns item with attrs' do
        post(path, params: params_with_translated_attrs)
        json_item = json_included_objects_of_type('items').first
        expect(json_item['attributes']['name']).to eq('Something great')
        expect(json_item['attributes']['content']).to eq("Isn't this a cool widget?")

        item = Item.find(json_item['id'])
        expect(item.translated_name_es).to eq('Algo genial')
        expect(item.translated_content_es).to eq('¿No es este un widget genial?')
      end
    end
  end

  describe 'PATCH #archive' do
    # user is an editor of collection
    let!(:collection_cards) { create_list(:collection_card_collection, 3, parent: collection) }
    let(:path) { '/api/v1/collection_cards/archive' }
    let(:card_ids) { collection_cards.pluck(:id) }
    let(:params) { { card_ids: card_ids }.to_json }

    context 'without record edit access' do
      before do
        remove_access(collection_cards, user)
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with link cards' do
      let!(:collection_cards) { create_list(:collection_card_link_text, 3, parent: collection) }
      context 'without record edit access, but with collection access' do
        before do
          remove_access(collection_cards, user)
        end

        it 'returns a 200' do
          patch(path, params: params)
          expect(response.status).to eq(200)
        end
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
        expect(broadcaster_instance).to receive(:cards_archived).with(
          array_including(card_ids),
        )
        patch(path, params: params)
      end
    end
  end

  describe 'PATCH #unarchive' do
    let!(:collection_cards) { create_list(:collection_card_collection, 3, parent: collection) }
    let(:path) { '/api/v1/collection_cards/unarchive' }
    let(:card_ids) { collection_cards.pluck(:id) }
    let(:raw_params) do
      { card_ids: card_ids }
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
        expect(broadcaster_instance).to receive(:cards_updated).with(
          array_including(card_ids),
        )
        patch(path, params: params)
      end

      context 'with snapshot' do
        let(:cards) { collection.collection_cards.to_a }
        let!(:unarchiving_card) { cards.first }
        let!(:card2) { cards.second }
        let!(:card3) { cards.third }
        let(:raw_params) do
          {
            card_ids: [unarchiving_card.id],
            collection_snapshot: {
              id: collection.id,
              attributes: {
                collection_cards_attributes: [
                  { id: unarchiving_card.id, order: 0, width: 2, height: 1 },
                  { id: card2.id, order: 1 },
                  { id: card3.id, order: 2 },
                ],
              },
            },
          }
        end

        it 'restores cards to their former attributes' do
          expect(unarchiving_card.active?).to be true
          expect(unarchiving_card.width).to eq 1
          expect(collection.collection_cards.first).to eq unarchiving_card
          # now archive
          unarchiving_card.archive!
          collection.reload
          expect(unarchiving_card.active?).to be false
          expect(collection.collection_cards.first).not_to eq unarchiving_card
          # now unarchive
          patch(path, params: params)
          collection.reload
          unarchiving_card.reload
          # should be mapped to snapshot
          expect(unarchiving_card.active?).to be true
          expect(unarchiving_card.width).to eq 2
          expect(unarchiving_card.order).to eq 0
          expect(collection.collection_cards.first).to eq unarchiving_card
        end
      end
    end
  end

  describe 'PATCH #add_tag' do
    let!(:collection_cards) { create_list(:collection_card_collection, 3, parent: collection) }
    let(:path) { '/api/v1/collection_cards/add_tag' }
    let(:raw_params) do
      {
        card_ids: collection_cards.map(&:id),
        tag: 'cats',
      }
    end
    let(:params) { raw_params.to_json }

    before do
      allow(CollectionCardsAddRemoveTagWorker).to receive(:perform_async)
    end

    it 'calls CollectionCardsAddRemoveTagWorker' do
      expect(
        CollectionCardsAddRemoveTagWorker,
      ).to receive(:perform_async).with(
        contain_exactly(*collection_cards.map(&:id)),
        'cats',
        :add,
        user.id,
      )
      patch(path, params: params)
    end
  end

  describe 'PATCH #remove_tag' do
    let!(:collection_cards) { create_list(:collection_card_collection, 3, parent: collection) }
    let(:path) { '/api/v1/collection_cards/remove_tag' }
    let(:raw_params) do
      {
        card_ids: collection_cards.map(&:id),
        tag: 'parrots',
      }
    end
    let(:params) { raw_params.to_json }

    before do
      allow(CollectionCardsAddRemoveTagWorker).to receive(:perform_async)
    end

    it 'calls CollectionCardsAddRemoveTagWorker' do
      expect(
        CollectionCardsAddRemoveTagWorker,
      ).to receive(:perform_async).with(
        contain_exactly(*collection_cards.map(&:id)),
        'parrots',
        :remove,
        user.id,
      )
      patch(path, params: params)
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

    context 'with edit access' do
      let(:to_collection) { create(:collection, add_editors: [user]) }
      it 'should be successful' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end

      context 'with pinned_and_locked cards' do
        before do
          # pinned outside of a master_template == pinned_and_locked
          moving_cards.first.update(pinned: true)
        end

        it 'returns a 401' do
          patch(path, params: params)
          expect(response.status).to eq(401)
        end
      end

      context 'trying to move into a test collection' do
        let(:to_collection) { create(:test_collection, add_editors: [user]) }

        it 'returns a 422' do
          patch(path, params: params)
          expect(response.status).to eq(422)
        end
      end
    end

    context 'without content editor access for to_collection' do
      let(:to_collection) { create(:collection) }

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'without edit access for all cards' do
      let!(:to_collection) { create(:collection, add_editors: [user]) }
      before do
        # user will no longer be an editor
        moving_cards.first.record.unanchor!
      end

      context 'but with edit access to the from_collection' do
        it 'returns a 200' do
          patch(path, params: params)
          expect(moving_cards.first.can_edit?(user)).to be false
          expect(response.status).to eq(200)
        end
      end

      context 'and without edit access to the from_collection' do
        before do
          user.remove_role(Role::EDITOR, from_collection)
        end
        it 'returns a 401' do
          patch(path, params: params)
          expect(response.status).to eq(401)
        end
      end
    end

    context 'without read access for from_collection' do
      let!(:to_collection) { create(:collection, add_editors: [user]) }
      before do
        user.remove_role(Role::EDITOR, from_collection)
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with read access for from_collection' do
      let!(:from_collection) do
        create(:collection, organization: to_collection.organization, num_cards: 3, add_viewers: [user])
      end
      let!(:to_collection) { create(:collection, add_editors: [user]) }
      before do
        moving_cards.each do |card|
          card.record.unanchor!
          # user can edit the records but not the parent collection
          user.add_role(Role::EDITOR, card.record)
        end
      end

      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end

      context 'even if from_id param is absent' do
        let(:raw_params) do
          {
            to_id: to_collection.id,
            collection_card_ids: moving_cards.map(&:id),
            placement: 'beginning',
          }
        end

        it 'returns a 200' do
          patch(path, params: params)
          expect(response.status).to eq(200)
        end
      end
    end

    context 'moving link cards' do
      let!(:from_collection) do
        create(
          :collection,
          organization: to_collection.organization,
          num_cards: 3,
          record_type: :link_text,
          card_relation: :link,
          add_editors: [user],
        )
      end
      let!(:to_collection) { create(:collection, add_editors: [user]) }
      before do
        # similar to above, user will no longer be an editor
        # shouldn't matter since it's a link
        moving_cards.first.record.unanchor!
      end

      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
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
        expect(moving_cards.first.record.editors[:users].include?(editor)).to be true
        expect(moving_cards.first.record.viewers[:users].include?(viewer)).to be true
      end

      it 'broadcasts collection updates' do
        expect(broadcaster_instance).to receive(:cards_archived).with(
          # this is for the from_collection
          moving_cards.pluck(:id),
        )
        expect(broadcaster_instance).to receive(:cards_updated).with(
          # this is for the to_collection
          moving_cards.pluck(:id),
        )
        patch(path, params: params)
      end

      it 'creates an activity' do
        expect(ActivityAndNotificationForCardWorker).to receive(:perform_async).twice
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

      context 'with cards > bulk_operation_threshold' do
        let(:placeholder) { create(:collection_card_placeholder) }
        let(:moving_cards) { from_collection.collection_cards.first(3) }

        before do
          ENV['BULK_OPERATION_THRESHOLD'] = '3'
        end
        after do
          ENV['BULK_OPERATION_THRESHOLD'] = nil
        end

        it 'should call perform_bulk_operation instead of CardMover' do
          expect(CardMover).not_to receive(:new)
          expect(BulkCardOperationProcessor).to receive(:call).with(
            placement: 'beginning',
            action: 'move',
            cards: moving_cards,
            to_collection: to_collection,
            for_user: user,
          ).and_return(placeholder)
          patch(path, params: params)
          expect(json['data']['attributes']).to match_json_schema('collection_card')
          expect(json['data']['id']).to eq placeholder.id.to_s
          expect(json['meta']).to eq('placeholder' => true)
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

      it 'returns the new link cards' do
        amount = moving_cards.count
        expect {
          post(path, params: params)
        }.to change(CollectionCard::Link, :count).by(amount)
        expect(json['data'].first['attributes']).to match_json_schema('collection_card')
        expect(json['data'].count).to eq amount
        created_ids = CollectionCard::Link.last(amount).pluck(:id)
        expect(json['data'].map { |cc| cc['id'].to_i }).to match_array(created_ids)
      end

      it 'links cards from one collection to the other' do
        expect(moving_cards.map(&:parent_id).uniq).to match_array [from_collection.id]
        post(path, params: params)
        # newly linked cards should link to the original moving_cards' items
        expect(to_collection.collection_cards.first(2).map(&:item)).to match_array moving_cards.map(&:item)
        expect(to_collection.collection_cards.first.link?).to be true
      end

      it 'broadcasts collection updates' do
        post(path, params: params)
        card_ids = to_collection.collection_cards.first(2).pluck(:id)
        expect(broadcaster_instance).to have_received(:cards_updated).with(
          array_including(card_ids),
        )
      end

      context 'even if from_id param is absent' do
        let(:raw_params) do
          {
            to_id: to_collection.id,
            collection_card_ids: moving_cards.map(&:id),
            placement: 'beginning',
          }
        end

        it 'returns a 200' do
          post(path, params: params)
          expect(response.status).to eq(200)
        end
      end
    end
  end

  describe 'POST #duplicate' do
    let!(:from_collection) { create(:collection, num_cards: 3, add_editors: [user]) }
    let!(:moving_cards) { from_collection.collection_cards.first(2) }
    let!(:unmoved_card) { from_collection.collection_cards.last }
    let(:path) { '/api/v1/collection_cards/duplicate' }
    let(:placement) { 'beginning' }
    let(:raw_params) do
      {
        from_id: from_collection.id,
        to_id: to_collection.id,
        collection_card_ids: moving_cards.map(&:id),
        placement: placement,
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

      it 'returns the new duplicate cards' do
        amount = moving_cards.count
        expect {
          post(path, params: params)
        }.to change(CollectionCard::Placeholder, :count).by(amount)
        expect(json['data'].first['attributes']).to match_json_schema('collection_card')
        expect(json['data'].count).to eq amount
        created_ids = CollectionCard::Placeholder.last(amount).pluck(:id)
        expect(json['data'].map { |cc| cc['id'].to_i }).to match_array(created_ids)
      end

      it 'duplicates cards from one collection to the other' do
        expect(CollectionCardDuplicator).to receive(:call).with(
          to_collection: to_collection,
          cards: moving_cards,
          placement: placement,
          for_user: user,
        ).and_call_original
        post(path, params: params)
      end

      context 'with cards > bulk_operation_threshold' do
        let(:placeholder) { create(:collection_card_placeholder) }
        let(:moving_cards) { from_collection.collection_cards.first(3) }

        before do
          ENV['BULK_OPERATION_THRESHOLD'] = '3'
        end
        after do
          ENV['BULK_OPERATION_THRESHOLD'] = nil
        end

        it 'should call perform_bulk_operation instead of CollectionCardDuplicator' do
          expect(CollectionCardDuplicator).not_to receive(:call)
          expect(BulkCardOperationProcessor).to receive(:call).with(
            placement: placement,
            action: 'duplicate',
            cards: array_including(moving_cards),
            to_collection: instance_of(Collection),
            for_user: user,
          ).and_return(placeholder)
          post(path, params: params)
          expect(json['data']['attributes']).to match_json_schema('collection_card')
          expect(json['data']['id']).to eq placeholder.id.to_s
          expect(json['meta']).to eq('placeholder' => true)
        end
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
      patch(path, params: params)
      card = CollectionCard.find(json['data']['id'])
      expect(broadcaster_instance).to have_received(:card_updated).with(
        card,
      )
    end

    it 'creates an activity' do
      patch(path, params: params)
      expect(ActivityAndNotificationForCardWorker).to have_received(:perform_async).with(
        user.id,
        json['data']['id'].to_i,
        :edited,
        nil,
        nil,
      )
    end

    context 'when changing the is_cover property' do
      let(:parent_collection) { create(:collection, organization: organization) }
      let(:collection) { create(:collection, organization: organization, parent_collection: parent_collection, add_editors: [user]) }

      let(:raw_params) do
        {
          is_cover: true,
        }
      end

      it 'broadcasts both collection + parent collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:new).with(
          collection,
          user,
        )
        expect(CollectionUpdateBroadcaster).to receive(:new).with(
          parent_collection,
          user,
        )
        patch(path, params: params)
        card = CollectionCard.find(json['data']['id'])
        expect(broadcaster_instance).to have_received(:card_updated).with(
          card,
        ).twice
      end
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

  describe 'PATCH #update_card_filter' do
    let(:collection) { create(:collection, organization: organization) }
    let(:collection_card) { create(:collection_card_text, parent: collection) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}/update_card_filter" }
    let(:raw_params) do
      {
        parent_id: collection.id,
        filter: 'nothing',
      }
    end
    let(:params) { json_api_params('collection_cards', raw_params) }

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

    it 'broadcasts collection updates' do
      patch(path, params: params)
      expect(broadcaster_instance).to have_received(:card_updated).with(
        collection_card,
      )
    end

    context 'without content editor access on the collection card' do
      let(:user) { create(:user, add_to_org: create(:organization)) }

      before do
        user.add_role(Role::VIEWER, collection_card.item)
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'without content editor access on the parent collection' do
      let(:user) { create(:user, add_to_org: create(:organization)) }

      before do
        user.add_role(Role::VIEWER, collection)
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
        collection.unanchor_and_inherit_roles_from_anchor!
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
        patch(path, params: params)
        expect(ActivityAndNotificationForCardWorker).to have_received(:perform_async).with(
          user.id,
          json['data']['id'].to_i,
          :replaced,
          nil,
          nil,
        )
      end

      it 'broadcasts collection updates' do
        patch(path, params: params)
        card = CollectionCard.find(json['data']['id'])
        expect(broadcaster_instance).to have_received(:card_updated).with(
          card,
        )
      end

      context 'with question item params' do
        let!(:collection) { create(:test_collection, organization: organization) }
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
              question_type: :question_multiple_choice,
            },
          }
        end

        it 'replaces the QuestionItem' do
          expect do
            patch(path, params: params)
          end.not_to change(Item::QuestionItem, :count)
          expect(json['data']['attributes']['card_question_type']).to eq 'question_multiple_choice'
        end

        it 'creates the multiple choice defaults' do
          expect do
            patch(path, params: params)
          end.to change(QuestionChoice, :count)
          expect(collection_card.item.question_choices.count).to eq 4
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

  describe '#POST toggle_pin' do
    let(:master) {
      create(:collection,
             master_template: true,
             num_cards: 1,
             pin_cards: true,
             created_by: user,
             add_editors: [user])
    }
    let(:collection_card) { create(:collection_card_collection, parent: master) }
    let(:path) { "/api/v1/collection_cards/#{collection_card.id}/toggle_pin" }
    let(:params) { json_api_params('collection_cards', pinned: true) }

    context 'with pinned true' do
      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end
    end

    context 'with pinned false' do
      let!(:params) { json_api_params('collection_cards', pinned: false) }

      it 'returns a 200' do
        patch(path, params: params)
        expect(response.status).to eq(200)
      end
    end

    context 'with toggle_pin using template instance' do
      let(:instance) { create(:collection, template: master, created_by: user) }
      let!(:collection_card) { create(:collection_card_collection, parent: instance) }
      let!(:path) { "/api/v1/collection_cards/#{collection_card.id}/toggle_pin" }

      before do
        master.setup_templated_collection(
          for_user: user,
          collection: instance,
          synchronous: :first_level,
        )
      end

      it 'returns a 401' do
        patch(path, params: params)
        expect(response.status).to eq(401)
      end
    end
  end

  describe '#POST create_bct' do
    let(:path) { '/api/v1/collection_cards/create_bct' }
    let(:raw_params) do
      {
        row: 0,
        col: 2,
        parent_id: collection.id,
      }
    end
    let(:params) { json_api_params('collection_cards', raw_params) }
    let(:bad_params) do
      json_api_params('collection_cards', parent_id: collection.id)
    end

    before do
      allow(CollectionGrid::BctInserter).to receive(:new).and_call_original
    end

    context 'without content editor access' do
      let(:user) { create(:user) }

      it 'returns a 401' do
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with errors' do
      it 'returns a 422 bad request' do
        post(path, params: bad_params)
        expect(response.status).to eq(422)
      end
    end

    context 'success' do
      let(:collection) { create(:board_collection, add_editors: [user]) }

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'creates a placeholder' do
        expect(CollectionGrid::BctInserter).to receive(:new).with(
          row: 0,
          col: 2,
          collection: collection,
        )
        expect {
          post(path, params: params)
        }.to change(CollectionCard::Placeholder, :count).by(1)
        expect(json['data']['attributes']).to match_json_schema('collection_card')
        expect(json['data']['attributes']['row']).to eq 0
        expect(json['data']['attributes']['col']).to eq 2
        expect(json['data']['attributes']['private_card']).to be nil
        expect(json['data']['attributes']['class_type']).to eq 'CollectionCard::Placeholder'
      end
    end
  end
end
