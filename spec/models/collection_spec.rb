require 'rails_helper'

describe Collection, type: :model do
  context 'associations' do
    it { should have_many :collection_cards }
    it { should have_many :reference_collection_cards }
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

  describe '#collection_cards_viewable_by' do
    let!(:collection) { create(:collection, num_cards: 3) }
    let!(:subcollection_card) { create(:collection_card_collection, parent: collection) }
    let(:cards) { collection.collection_cards }
    let(:user) { create(:user) }

    before do
      user.add_role(Role::VIEWER, collection)
      collection.items.each do |item|
        user.add_role(Role::VIEWER, item)
      end
      user.add_role(Role::VIEWER, subcollection_card.collection)
    end

    it 'should show all cards without limiting' do
      expect(collection.collection_cards_viewable_by(cards, user)).to match_array(cards)
    end

    context 'if one item is private' do
      let(:private_card) { cards[0] }

      before do
        user.remove_role(Role::VIEWER, private_card.record)
      end

      it 'should not include card' do
        expect(collection.collection_cards_viewable_by(cards, user)).not_to include(private_card)
        expect(collection.collection_cards_viewable_by(cards, user)).to match_array(cards - [private_card])
      end
    end

    context 'if one subcollection is private' do
      let(:private_card) { subcollection_card }

      before do
        user.remove_role(Role::VIEWER, subcollection_card.collection)
      end

      it 'should not include card' do
        expect(collection.collection_cards_viewable_by(cards, user)).not_to include(private_card)
        expect(collection.collection_cards_viewable_by(cards, user)).to match_array(cards - [private_card])
      end
    end
  end
end
