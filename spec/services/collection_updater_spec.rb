require 'rails_helper'

RSpec.describe CollectionUpdater, type: :service do
  describe '#call' do
    let!(:collection) { create(:collection, num_cards: 3) }
    let(:first_card) { collection.collection_cards.first }
    let(:attributes) { {} }

    context 'with valid attributes' do
      let(:attributes) do
        { name: 'My new name', collection_cards_attributes: { id: first_card.id, order: 3, width: 3 } }
      end

      it 'assigns and saves attributes onto the collection' do
        CollectionUpdater.call(collection, attributes)
        expect(collection.name).to eq attributes[:name]
      end

      it 'assigns and saves attributes onto the collection cards' do
        CollectionUpdater.call(collection, attributes)
        first_card.reload
        expect(first_card.order).to eq 3
        expect(first_card.width).to eq 3
      end

      it 'always sets collection.updated_at' do
        expect {
          CollectionUpdater.call(collection, attributes)
        }.to change(collection, :updated_at)
      end

      it 'caches the collection cover if the updated cards are relevant' do
        collection.cache_cover!
        # changing the card's order will affect the cover
        expect {
          CollectionUpdater.call(collection, attributes)
        }.to change(collection, :cached_cover)
      end

      it 'does not cache the collection cover if not needed' do
        # call it once, attrs are saved and cover is cached
        CollectionUpdater.call(collection, attributes)
        # second time with same attrs shouldn't change anything
        expect {
          CollectionUpdater.call(collection, attributes)
        }.not_to change(collection, :cached_cover)
      end
    end

    context 'with invalid attributes' do
      let(:attributes) { { name: nil } }
      let(:result) { CollectionUpdater.call(collection, attributes) }

      it 'returns false with errors on collection' do
        expect(result).to be false
        expect(collection.errors).not_to be_empty
      end
    end
  end
end
