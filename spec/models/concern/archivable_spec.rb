require 'rails_helper'

describe Archivable, type: :concern do
  it 'should have concern included' do
    expect(Item.ancestors).to include(Archivable)
    expect(Collection.ancestors).to include(Archivable)
    expect(CollectionCard.ancestors).to include(Archivable)
  end

  describe 'scopes' do
    let!(:collection) { create(:collection, num_cards: 3) }

    it 'should be active by default' do
      expect(collection.active?).to be true
    end

    it 'should have a default scope that only finds active objects' do
      expect {
        collection.archive!
      }.to change(Collection, :count).by(-1)
    end

    it 'should use default active scope when looking up related objects' do
      expect {
        collection.collection_cards.first.archive!
      }.to change(collection.collection_cards, :count).by(-1)
    end
  end

  describe 'methods' do
    describe '#archive!' do
      let(:collection_card) { create(:collection_card_collection) }
      let(:collection) { create(:collection, num_cards: 3, parent_collection_card: collection_card) }

      it 'can be archived' do
        collection_card.archive!
        expect(collection_card.active?).to be false
        expect(collection_card.archived?).to be true
      end

      it 'should be able to archive related items/collections' do
        collection_card.archive! with: [:collection]
        expect(collection_card.archived?).to be true
        expect(collection_card.collection.archived?).to be true
      end

      it 'should be able to archive the parent card with the collection' do
        collection.archive!(with: [:parent_collection_card])
        expect(collection.archived?).to be true
        expect(collection_card.archived?).to be true
      end

      it 'should be able to archive without affecting relations' do
        collection_card.archive!
        expect(collection_card.archived?).to be true
        expect(collection_card.collection.archived?).to be false
      end
    end
  end
end
