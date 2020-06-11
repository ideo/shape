require 'rails_helper'

describe JsonapiCache::CollectionCardRenderer, type: :concern do
  let(:user) { create(:user) }
  let(:collection) { create(:collection) }
  let(:cards) { collection.collection_cards }
  let(:json) { subject.call }
  let(:first_result) { json[:data].first }
  let(:related) { first_result[:relationships][:record][:data] }
  let(:related_json) do
    json[:included].select { |r| r[:id] == related[:id] && r[:type] == related[:type] }.first
  end
  let(:search_records) { nil }

  subject do
    JsonapiCache::CollectionCardRenderer.new(
      cards: cards,
      user: user,
      collection: collection,
      search_records: search_records,
    )
  end

  describe '#call' do
    context 'with view access' do
      let(:collection) { create(:collection, num_cards: 2, add_viewers: [user]) }

      it 'returns jsonapi formatted collection card' do
        expect(json[:data].count).to eq 2
        expect(first_result[:id]).to eq cards.first.id.to_s
        expect(first_result[:attributes]).to match_json_schema('collection_card')
        expect(first_result[:attributes][:can_edit_parent]).to be false
      end

      it 'includes permissions on the card' do
        expect(first_result[:attributes][:can_edit_parent]).to be false
        expect(first_result[:attributes][:private_card]).to be nil
      end

      it 'includes related record and adds can_view/can_edit attributes' do
        expect(related).to eq(type: :items, id: cards.first.record.id.to_s)
        expect(related_json[:attributes][:can_view]).to be true
        expect(related_json[:attributes][:can_edit]).to be false
        expect(related_json[:attributes][:can_edit_content]).to be false
      end

      it 'preloads roles' do
        expect(user).to receive(:precache_roles_for).with(
          [Role::VIEWER, Role::CONTENT_EDITOR, Role::EDITOR],
          resource_identifiers: ["Collection_#{collection.id}"],
        )
        subject.call
      end

      context 'with search records' do
        # user has to be in the right org for the breadcrumb to show the collection
        let(:organization) { create(:organization) }
        let(:collection) { create(:collection, num_cards: 2, add_viewers: [user], organization: organization) }
        let(:user) { create(:user, add_to_org: organization) }
        let(:cards) { [card] }
        let(:card) { collection.collection_cards.last }
        let(:search_records) { [card.item] }

        it 'includes breadcrumb attributes for user' do
          breadcrumb = related_json[:attributes][:breadcrumb]
          expect(breadcrumb.count).to eq 2
          expect(breadcrumb.first[:name]).to eq collection.name
          expect(breadcrumb.last[:name]).to eq card.record.name
          expect(related_json[:attributes][:in_my_collection]).to eq false
        end
      end

      context 'with public view access' do
        let(:collection) { create(:collection, num_cards: 2, anyone_can_view: true) }
        let!(:subcollection) { create(:collection, parent_collection: collection) }
        let(:cards) do
          CollectionCardFilter::ForPublic.call(
            cards_scope: collection.collection_cards,
          )
        end

        it 'gets public cards' do
          subject.call
          expect(json[:data].count).to eq 3
          expect(first_result[:id]).to eq cards.first.id.to_s
          expect(first_result[:attributes]).to match_json_schema('collection_card')
        end
      end
    end

    context 'with edit access' do
      let(:collection) { create(:collection, num_cards: 2, add_editors: [user]) }

      it 'includes permissions on the card' do
        expect(first_result[:attributes][:can_edit_parent]).to be true
        expect(first_result[:attributes][:private_card]).to be nil
      end

      it 'includes related record and adds can_view/can_edit attributes' do
        expect(related).to eq(type: :items, id: cards.first.record.id.to_s)
        expect(related_json[:attributes][:can_view]).to be true
        expect(related_json[:attributes][:can_edit]).to be true
        expect(related_json[:attributes][:can_edit_content]).to be true
      end
    end

    context 'without view access' do
      let(:collection) { create(:collection, num_cards: 2) }

      it 'adds private_card attribute and does not include the related record' do
        expect(json[:data].count).to eq 2
        expect(first_result[:id]).to eq cards.first.id.to_s
        expect(first_result[:attributes][:can_view]).to be nil
        expect(first_result[:attributes][:private_card]).to be true
        expect(first_result[:relationships][:record][:meta]).to eq(included: false)
      end
    end
  end

  describe '#render_cached_card' do
    let(:collection) { create(:collection, num_cards: 1, add_viewers: [user]) }
    let(:card) { cards.first }

    it 'renders a single cached card' do
      json = subject.render_cached_card(card)
      expect(json[:data][:id]).to eq card.id.to_s
      expect(json[:data][:attributes]).to match_json_schema('collection_card')
    end

    context 'with caching enabled' do
      let(:memory_store) { ActiveSupport::Cache.lookup_store(:memory_store) }
      let(:cache) { Rails.cache }

      before do
        allow(Rails).to receive(:cache).and_return(memory_store)
        Rails.cache.clear
        # make sure this was in the past to get triggered by a new update
        card.update_columns(updated_at: 5.minutes.ago)
      end

      it 'stores the result in cache' do
        expect(cache.exist?(card.cache_key)).to be false
        subject.render_cached_card(card)
        expect(cache.exist?(card.cache_key)).to be true
      end

      it 'loads the cached card' do
        subject.render_cached_card(card)
        # update without busting cache
        expect {
          card.update_columns(width: 2)
        }.not_to change(card, :cache_key)
        json = subject.render_cached_card(card)
        expect(json[:data][:attributes][:width]).to eq 1
        # now a real update
        expect {
          card.update(height: 2)
        }.to change(card, :cache_key)
        json = subject.render_cached_card(card)
        expect(json[:data][:attributes][:width]).to eq 2
        expect(json[:data][:attributes][:height]).to eq 2
      end

      context 'duplicating a card (from Placeholder to Primary)' do
        before do
          card.update(type: 'CollectionCard::Placeholder')
        end

        it 'will update the cached value when a card goes from Placeholder to Primary' do
          json = subject.render_cached_card(card)
          expect(json[:data][:attributes][:class_type]).to eq 'CollectionCard::Placeholder'
          expect {
            card.update(type: 'CollectionCard::Primary')
          }.to change(card, :cache_key)
          json = subject.render_cached_card(card)
          expect(json[:data][:attributes][:class_type]).to eq 'CollectionCard::Primary'
        end
      end
    end
  end
end
