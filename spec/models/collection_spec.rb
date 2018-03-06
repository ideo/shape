require 'rails_helper'

describe Collection, type: :model do
  context 'associations' do
    it { should have_many :collection_cards }
    it { should have_many :items }
    it { should have_many :collections }
    it { should have_one :parent_collection_card }
    it { should belong_to :cloned_from }
    it { should belong_to :organization }
  end

  describe '#duplicate' do
    let!(:collection) { create(:collection, num_cards: 5) }
    let(:duplicate) { collection.duplicate! }

    it 'clones the collection' do
      expect { collection.duplicate! }.to change(Collection, :count).by(1)
      expect(collection.id).not_to eq(duplicate.id)
    end

    it 'clones all the collection cards' do
      expect(duplicate.collection_cards.size).to eq(5)
      expect(collection.collection_cards.map(&:id)).not_to match_array(duplicate.collection_cards.map(&:id))
    end

    it 'clones all items' do
      expect(duplicate.items.size).to eq(5)
      expect(collection.items.map(&:id)).not_to match_array(duplicate.items.map(&:id))
    end

    context 'with parent collection card' do
      let!(:parent_collection_card) do
        create(:collection_card_collection, collection: collection)
      end

      it 'does not duplicate if no flag passed' do
        expect(duplicate.parent_collection_card).to be_nil
      end

      it 'duplicates parent' do
        dupe = collection.duplicate!(copy_parent_card: true)
        expect(dupe.id).not_to eq(collection.parent_collection_card.id)
      end

      it 'increases the order by 1' do
        dupe = collection.duplicate!(copy_parent_card: true)
        expect(dupe.parent_collection_card.order).to eq(collection.parent_collection_card.order + 1)
      end
    end
  end
end
