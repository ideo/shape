require 'rails_helper'

RSpec.describe CollectionCard, type: :model do
  context 'validations' do
    it { should validate_presence_of(:parent) }
    it { should validate_presence_of(:order) }

    describe '#single_item_or_collection_is_present' do
      let(:collection_card) { build(:collection_card) }
      let(:item) { create(:text_item) }
      let(:collection) { create(:collection) }

      it 'should add error if both item and collection are present' do
        collection_card.item = item
        collection_card.collection = collection
        expect(collection_card.valid?).to be false
        expect(collection_card.errors.full_messages).to include('Only one of Item or Collection can be assigned')
      end
    end

    describe '#card_is_only_non_reference' do
      context 'with item' do
        let!(:collection_card) { create(:collection_card_item) }
        # parent_collection_card relationship gets cached without a reload
        let(:item) { collection_card.item.reload }

        it 'should add error if item already has non-reference card' do
          card = build(:collection_card_item, item: item)
          expect(card.reference?).to be false
          expect(card.valid?).to be false
          expect(card.errors[:item]).to include('already has a primary card')
        end

        it 'should be valid if using reference card' do
          card = build(:collection_card_item, :reference, item: item)
          expect(card.reference?).to be true
          expect(card.valid?).to be true
        end
      end

      context 'with collection' do
        let!(:collection_card) { create(:collection_card_collection) }
        let!(:collection) { collection_card.collection.reload }

        it 'should add error if collection already has non-reference card' do
          card = build(:collection_card_collection, collection: collection)
          expect(card.reference?).to be false
          expect(card.valid?).to be false
          expect(card.errors[:collection]).to include('already has a primary card')
        end

        it 'should be valid if using reference card' do
          card = build(:collection_card_collection, :reference, collection: collection)
          expect(card.reference?).to be true
          expect(card.valid?).to be true
        end
      end
    end
  end
end
