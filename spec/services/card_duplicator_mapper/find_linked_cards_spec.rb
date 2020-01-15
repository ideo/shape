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

    it 'registers all linked cards' do
      subject.call
      linked_card_record_card = linked_text_card.record.parent_collection_card
      expect(subject.linked_cards).to eq(
        search_collection.parent_collection_card.id.to_s => {
          'remapper' => 'CardDuplicatorMapper::RemapSearchCollection',
          'within_collection_id' => search_collection_target.id,
        },
        collection_with_filter.parent_collection_card.id.to_s => {
          'remapper' => 'CardDuplicatorMapper::RemapCollectionFilter',
          'within_collection_id' => collection_with_filter_target.id,
        },
        linked_text_card.id.to_s => {
          'remapper' => 'CardDuplicatorMapper::RemapLinkItem',
          'record_card_id' => linked_card_record_card.id.to_s,
        },
        linked_card_record_card.id.to_s => {},
      )
    end
  end
end
