require 'rails_helper'

RSpec.describe BreadcrumbRecalculationWorker, type: :worker do
  describe '#perform' do
    let!(:collection) { create(:collection, num_cards: 5, breadcrumb: nil) }
    let!(:subcollection_card) { create(:collection_card_collection, parent: collection) }
    let!(:subcollection) { subcollection_card.collection }
    let(:new_name) { 'My new name' }
    let(:crumb) { ['Collection', collection.id, new_name] }

    before do
      collection.update(name: new_name)
    end

    it 'recalculates collection breadcrumb' do
      BreadcrumbRecalculationWorker.new.perform(collection.id, collection.breadcrumb_subtree_identifier_was)
      expect(collection.reload.breadcrumb.first).to match_array crumb
    end

    it 'recalculates child item breadcrumbs synchronously' do
      BreadcrumbRecalculationWorker.new.perform(collection.id, collection.breadcrumb_subtree_identifier_was)
      expect(collection.reload.items.first.breadcrumb.first).to match_array crumb
    end

    it 'calls recursive method' do
      expect_any_instance_of(Collection).to receive(
        :recalculate_breadcrumb_tree!,
      ).with(
        subtree_identifier: collection.breadcrumb_subtree_identifier,
        force_sync: true,
      ).once

      BreadcrumbRecalculationWorker.new.perform(
        collection.id,
        collection.breadcrumb_subtree_identifier
      )
    end

    it 'marks subtree as processing' do
      expect_any_instance_of(Collection).to receive(
        :mark_subtree_as_processing
      ).with(
        processing: true,
        subtree_identifier: collection.breadcrumb_subtree_identifier,
      ).once

      expect_any_instance_of(Collection).to receive(
        :mark_subtree_as_processing
      ).with(
        processing: false,
        subtree_identifier: collection.breadcrumb_subtree_identifier,
      ).once

      BreadcrumbRecalculationWorker.new.perform(
        collection.id,
        collection.breadcrumb_subtree_identifier
      )
    end

    it 'broadcasts collection as editing' do
      expect_any_instance_of(Collection).to receive(
        :processing_done
      ).once

      BreadcrumbRecalculationWorker.new.perform(
        collection.id,
        collection.breadcrumb_subtree_identifier
      )
    end
  end
end
