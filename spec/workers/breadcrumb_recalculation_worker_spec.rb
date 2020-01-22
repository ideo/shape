require 'rails_helper'

RSpec.describe BreadcrumbRecalculationWorker, type: :worker do
  describe '#perform' do
    let!(:collection) { create(:collection, num_cards: 5, breadcrumb: nil) }
    let!(:subcollection_card) { create(:collection_card_collection, parent: collection) }
    let!(:subcollection) { subcollection_card.collection }

    before do
      allow(Collection).to receive(:find).and_return(collection)
    end

    it 'calls recursive method' do
      expect(collection).to receive(
        :recalculate_breadcrumb_tree!,
      ).with(
        force_sync: true,
      ).once

      BreadcrumbRecalculationWorker.new.perform(collection.id)
    end

    context 'with card_ids' do
      let(:card_ids) { collection.collection_cards.first(2).pluck(:id) }

      it 'should call recalculate_child_breadcrumbs with those cards' do
        cards = CollectionCard.where(id: card_ids)
        expect(collection).to receive(:recalculate_child_breadcrumbs).with(cards)
        BreadcrumbRecalculationWorker.new.perform(collection.id, card_ids)
      end
    end
  end
end
