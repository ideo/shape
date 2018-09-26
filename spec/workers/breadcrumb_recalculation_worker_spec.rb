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

    it 'marks subtree as processing' do
      expect(collection).to receive(
        :mark_children_as_processing,
      ).with(
        processing: true,
      ).once

      expect(collection).to receive(
        :mark_children_as_processing,
      ).with(
        processing: false,
      ).once

      BreadcrumbRecalculationWorker.new.perform(
        collection.id,
      )
    end

    it 'broadcasts collection as editing' do
      expect(collection).to receive(
        :processing_done,
      ).once

      BreadcrumbRecalculationWorker.new.perform(
        collection.id,
      )
    end
  end
end
