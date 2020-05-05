require 'rails_helper'

RSpec.describe CollectionUpdateBroadcaster, type: :service do
  let(:collection) { create(:collection) }
  let(:user) { create(:user) }
  let(:broadcaster) { CollectionUpdateBroadcaster.new(collection, user) }

  describe '#cards_archived' do
    it 'should send archived_card_ids' do
      expect(collection).to receive(:received_changes).with(
        { archived_card_ids: %w[1 2 3] },
        user,
      )
      broadcaster.cards_archived([1, 2, 3])
    end
  end

  describe '#row_updated' do
    let(:row) { { row: 1, action: :insert_row } }
    it 'should send row_updated' do
      expect(collection).to receive(:received_changes).with(
        { row_updated: row },
        user,
      )
      broadcaster.row_updated(row)
    end
  end

  describe '#card_attrs_updated' do
    let(:data) { { attributes: 'xyz' } }

    it 'should send collection_cards_attributes' do
      expect(collection).to receive(:received_changes).with(
        { collection_cards_attributes: data },
        user,
      )
      broadcaster.card_attrs_updated(data)
    end
  end

  describe '#collection_updated' do
    it 'should send collection_updated' do
      expect(collection).to receive(:received_changes).with(
        { collection_updated: true },
        user,
      )
      broadcaster.collection_updated
    end
  end

  describe '#card_updated' do
    let!(:card) { create(:collection_card, parent: collection) }

    it 'should send card_id' do
      expect(collection).to receive(:received_changes).with(
        { card_id: card.id.to_s },
        user,
      )
      broadcaster.card_updated(card)
    end
  end

  describe '#cards_updated' do
    let(:card_ids) { [1, 2, 3] }

    it 'should send card_ids' do
      expect(collection).to receive(:received_changes).with(
        { card_ids: card_ids.map(&:to_s) },
        user,
      )
      broadcaster.cards_updated(card_ids)
    end
  end

  describe '#text_item_updated' do
    let!(:text_item) { create(:text_item, parent_collection: collection) }

    it 'should send text_item data' do
      expect(collection).to receive(:received_changes).with(
        {
          text_item: {
            id: text_item.id.to_s,
            quill_data: text_item.quill_data,
            parent_collection_card_id: text_item.parent_collection_card.id.to_s,
          },
        },
        user,
      )
      broadcaster.text_item_updated(text_item)
    end
  end

  describe '#reload_cards' do
    it 'should send reload_cards' do
      expect(collection).to receive(:received_changes).with(
        { reload_cards: true },
        user,
      )
      broadcaster.reload_cards
    end
  end
end
