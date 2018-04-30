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
      BreadcrumbRecalculationWorker.new.perform(collection.id)
      collection.reload
    end

    it 'recalculates collection breadcrumb' do
      expect(collection.breadcrumb.first).to match_array crumb
    end

    it 'recalculates child item breadcrumbs synchronously' do
      expect(collection.items.first.breadcrumb.first).to match_array crumb
    end

    it 'recalculates child collection breadcrumbs asynchronously' do
      expect(BreadcrumbRecalculationWorker).to receive(:perform_async)
      BreadcrumbRecalculationWorker.new.perform(collection.id)
    end
  end
end
