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
      expect(subject.linked_cards).to eq(
        search_collection.parent_collection_card.id.to_s => {
          'type' => 'search_filter',
          'within_collection_id' => search_collection_target.id.to_s,
          'collection_filter_id' => collection_filter.id.to_s,
        },
        linked_text_card.id.to_s => {
          'type' => 'link_item',
        },
      )
    end
  end
end
