require 'rails_helper'
require_relative 'shared_setup'

RSpec.describe CardDuplicatorMapper::FindLinkedCards, type: :service do
  include_context 'CardDuplicatorMapper setup'

  subject do
    CardDuplicatorMapper::FindLinkedCards.new(
      card_ids: card_ids,
      batch_id: batch_id,
    )
  end

  describe '#call' do
    before do
      # Stub out so that it doesn't clear cards
      allow(CardDuplicatorMapper::RemapLinkedCards).to receive(:call)
    end

    it 'registers link card and card it references' do
      subject.call
      linked_card_record_card = linked_text_card.record.parent_collection_card
      expect(subject.linked_cards).to include(
        linked_text_card.id.to_s => {
          'remapper' => 'CardDuplicatorMapper::RemapLinkItem',
          'record_card_id' => linked_card_record_card.id.to_s,
        },
        linked_card_record_card.id.to_s => {},
      )
    end

    it 'does not register archived link card and card it references' do
      subject.call
      archived_linked_card_record_card = archived_linked_text_card.record.parent_collection_card
      expect(subject.linked_cards).to_not include(
        archived_linked_text_card.id.to_s => {
          'remapper' => 'CardDuplicatorMapper::RemapLinkItem',
          'record_card_id' => archived_linked_card_record_card.id.to_s,
        },
        archived_linked_card_record_card.id.to_s => {},
      )
    end

    it 'registers search collection and referenced collection' do
      subject.call
      linked_collection_card = search_collection_target.parent_collection_card
      expect(subject.linked_cards).to include(
        search_collection.parent_collection_card.id.to_s => {
          'remapper' => 'CardDuplicatorMapper::RemapSearchCollection',
          'within_collection_id' => search_collection_target.id,
        },
        linked_collection_card.id.to_s => {},
      )
    end

    it 'registers collection with filter and referenced collection card' do
      subject.call
      linked_collection_card = collection_with_filter_target.parent_collection_card
      expect(subject.linked_cards).to include(
        collection_with_filter.parent_collection_card.id.to_s => {
          'remapper' => 'CardDuplicatorMapper::RemapCollectionFilter',
          'within_collection_id' => collection_with_filter_target.id,
        },
        linked_collection_card.id.to_s => {},
      )
    end
  end
end
