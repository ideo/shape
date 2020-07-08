require 'rails_helper'
require './spec/services/collection_broadcaster_shared_setup'


RSpec.describe CollectionGrid::BctRemover, type: :service do
  include_context 'CollectionUpdateBroadcaster setup'
  let(:placeholder_card) do
    create(:collection_card_placeholder, parent_snapshot: { 'collection_cards_attributes' => [] })
  end
  let(:collection) { placeholder_card.parent }
  let(:snapshot) { placeholder_card.parent_snapshot.deep_symbolize_keys }

  let(:service) do
    CollectionGrid::BctRemover.new(
      placeholder_card: placeholder_card,
    )
  end

  describe '#call' do
    it 'moves cards back to the prior snapshot' do
      expect(CollectionUpdater).to receive(:call).with(
        placeholder_card.parent,
        snapshot,
      )
      service.call
    end

    it 'broadcasts updates' do
      expect(CollectionUpdateBroadcaster).to receive(:new).with(
        collection,
      ).twice
      expect(broadcaster_instance).to receive(:card_attrs_updated).with(
        snapshot[:collection_cards_attributes],
      )
      expect(broadcaster_instance).to receive(:cards_archived).with(
        [placeholder_card.id],
      )
      service.call
    end
  end
end
