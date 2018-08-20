require 'rails_helper'

describe Archivable, type: :concern do
  it 'should have concern included' do
    expect(Item.ancestors).to include(Archivable)
    expect(Collection.ancestors).to include(Archivable)
    expect(CollectionCard.ancestors).to include(Archivable)
    expect(Group.ancestors).to include(Archivable)
  end

  describe 'scopes' do
    let!(:collection) { create(:collection, num_cards: 3) }
    let!(:collection_card) { create(:collection_card, collection: collection) }

    it 'should be active by default' do
      expect(collection.active?).to be true
    end

    it 'should have an active scope that only finds active objects' do
      expect {
        collection.archive!
      }.to change(Collection.active, :count).by(-1)
    end

    it 'should only look up active collection cards when retrieving a collection' do
      expect {
        collection.collection_cards.first.archive!
      }.to change(collection.collection_cards.active, :count).by(-1)
    end
  end

  describe 'methods' do
    describe '#archive!' do
      let(:collection_card) { create(:collection_card_collection) }
      let!(:collection) { create(:collection, num_cards: 3, parent_collection_card: collection_card) }
      let(:collection_card_link) { create(:collection_card_link, collection: collection) }
      let!(:subcollection_card) { create(:collection_card_collection, parent: collection) }
      let!(:subcollection) { subcollection_card.collection }

      it 'can be archived' do
        collection_card.archive!
        expect(collection_card.active?).to be false
        expect(collection_card.archived?).to be true
      end

      it 'should archive related items/collections' do
        collection_card.archive!
        expect(collection_card.archived?).to be true
        expect(collection_card.collection.archived?).to be true
      end

      it 'should archive the parent card with the collection' do
        collection.archive!
        expect(collection.archived?).to be true
        expect(collection_card.archived?).to be true
      end

      it 'should recursively archive everything within a collection' do
        # archiving from the parent card
        collection_card.archive!
        # should archive the collection
        expect(collection.archived?).to be true
        # and that collection's card(s)
        expect(collection.all_collection_cards.first.archived?).to be true
        # including each card's items/collections...
        expect(collection.all_collection_cards.first.record.archived?).to be true
        expect(subcollection.reload.archived?).to be true
      end

      it 'should only archive the linked card and not its collection' do
        # archiving from the parent card
        collection_card_link.archive!
        # should not archive the collection
        expect(collection.archived?).to be false
        expect(collection_card_link.archived?).to be true
      end
    end

    describe '#unarchive!' do
      let(:parent) { create(:collection, num_cards: 3) }
      let(:collection_card) { create(:collection_card, parent: parent, order: 3) }
      let!(:collection) { create(:collection, num_cards: 2, parent_collection_card: collection_card) }

      before do
        parent.reorder_cards!
      end

      it 'can be unarchived' do
        collection.archive!
        expect(collection.reload.archived?).to be true
        collection.unarchive!
        expect(collection.reload.archived?).to be false
      end

      it 'will retain its original place in the collection' do
        expect(parent.collection_cards.map(&:order)).to match_array([0, 1, 2, 3])
        collection.archive!
        expect(parent.reload.collection_cards.map(&:order)).to match_array([0, 1, 2])
        collection.unarchive!
        expect(parent.reload.collection_cards.map(&:order)).to match_array([0, 1, 2, 3])
      end

      it 'will unarchive related items' do
        expect {
          collection.archive!
        }.to change(Item.archived, :count).by(2)
        expect(collection_card.reload.archived?).to be true
        expect {
          collection.unarchive!
        }.to change(Item.active, :count).by(2)
        expect(collection_card.reload.active?).to be true
      end
    end
  end
end
