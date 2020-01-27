require 'rails_helper'

RSpec.describe CardDuplicatorMapperFindLinkedCardsWorker, type: :worker do
  let(:batch_id) { "duplicate-#{SecureRandom.hex(10)}" }
  let(:user) { create(:user) }
  let(:collection) { create(:collection, num_cards: 5) }
  let(:cards) { collection.collection_cards }
  let(:card_ids) { cards.pluck(:id) }
  let(:system_collection) { false }
  let(:params) do
    [
      batch_id,
      card_ids,
      user&.id,
      system_collection,
    ]
  end
  let(:perform) do
    CardDuplicatorMapperFindLinkedCardsWorker.perform_sync(*params)
  end

  describe '#perform' do
    it 'calls CardDuplicatorMapper::FindLinkedCards to map all cards that need updating' do
      expect(CardDuplicatorMapper::FindLinkedCards).to receive(:call).with(
        batch_id: batch_id,
        card_ids: card_ids,
        for_user: user,
        system_collection: system_collection,
      )
      perform
    end
  end
end
