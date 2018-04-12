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

    describe '#card_is_only_primary_card' do
      context 'with item' do
        let!(:collection_card) { create(:collection_card_text) }
        # parent_collection_card relationship gets cached without a reload
        let(:item) { collection_card.item.reload }

        it 'should add error if item already has non-link card' do
          card = build(:collection_card_text, item: item)
          expect(card.link?).to be false
          expect(card.valid?).to be false
          expect(card.errors[:item]).to include('already has a primary card')
        end

        it 'should be valid if using link card' do
          card = build(:collection_card_link_text, item: item)
          expect(card.link?).to be true
          expect(card.valid?).to be true
        end
      end

      context 'with collection' do
        let!(:collection_card) { create(:collection_card_collection) }
        let!(:collection) { collection_card.collection.reload }

        it 'should add error if collection already has non-link card' do
          card = build(:collection_card_collection, collection: collection)
          expect(card.link?).to be false
          expect(card.valid?).to be false
          expect(card.errors[:collection]).to include('already has a primary card')
        end

        it 'should be valid if using link card' do
          card = build(:collection_card_link_collection, collection: collection)
          expect(card.link?).to be true
          expect(card.valid?).to be true
        end
      end
    end
  end

  describe '#duplicate!' do
    let(:user) { create(:user) }
    let!(:collection_card) { create(:collection_card_text) }
    let(:shallow) { false }
    let(:update_order) { false }
    let(:duplicate) do
      collection_card.duplicate!(
        for_user: user,
        shallow: shallow,
        update_order: update_order,
      )
    end

    before do
      user.add_role(Role::EDITOR, collection_card.item)
    end

    it 'should create copy of card' do
      expect(duplicate.id).not_to eq(collection_card.id)
    end

    it 'should duplicate item' do
      expect { duplicate }.to change(Item, :count).by(1)
    end

    it 'should not call increment_card_orders!' do
      expect_any_instance_of(CollectionCard).not_to receive(:increment_card_orders!)
      duplicate
    end

    context 'for collection' do
      let!(:collection_card_collection) { create(:collection_card_collection) }
      let(:duplicate) do
        collection_card_collection.duplicate!(
          for_user: user,
        )
      end

      before do
        user.add_role(Role::EDITOR, collection_card_collection.collection)
      end

      it 'should duplicate collection' do
        expect { duplicate }.to change(Collection, :count).by(1)
      end
    end

    context 'with shallow true' do
      let!(:shallow) { true }

      it 'should not duplicate item' do
        expect { duplicate }.not_to change(Item, :count)
      end

      it 'should not duplicate collection' do
        expect { duplicate }.not_to change(Collection, :count)
      end
    end

    context 'with update_order true' do
      let!(:update_order) { true }

      it 'should call increment_card_orders!' do
        expect_any_instance_of(CollectionCard).to receive(:increment_card_orders!)
        duplicate
      end
    end

    context 'for user collection' do
      let!(:shared_with_me_collection) { create(:shared_with_me_collection) }
      let!(:collection_card_collection) { create(:collection_card, collection: shared_with_me_collection) }
      let(:duplicate) do
        collection_card_collection.duplicate!(
          for_user: user
        )
      end

      it 'should return errors' do
        expect(duplicate.errors[:collection]).to include('cannot be a SharedWithMeCollection for duplication')
      end
    end
  end

  describe '#copy_into_new_link_card' do
    let(:collection_card) { create(:collection_card) }
    let(:collection_card_link) { collection_card.copy_into_new_link_card }

    it 'should setup a new link card record with same properties as original' do
      expect(collection_card.primary?).to be true
      expect(collection_card_link.new_record?).to be true
      expect(collection_card_link.link?).to be true
    end
  end

  describe '#increment_card_orders!' do
    let(:collection) { create(:collection) }
    let!(:collection_card_list) { create_list(:collection_card, 5, parent: collection) }
    let(:collection_cards) { collection.collection_cards }

    before do
      # Make sure cards are in sequential order
      collection.reorder_cards!
    end

    it 'should increment all orders by 1' do
      collection_cards.first.increment_card_orders!
      order_arr = collection_cards.map(&:reload).map(&:order)
      expect(order_arr).to match_array([0, 2, 3, 4, 5])
    end

    it 'should return true if success' do
      expect(collection_cards.first.increment_card_orders!).to be true
    end

    context 'with another card created at same order as existing' do
      let(:second_card_order) { collection.collection_cards[1].order }
      let!(:dupe_card) do
        create(:collection_card, parent: collection, order: second_card_order)
      end

      it 'should increment all cards by 1, and leave dupe card' do
        expect(dupe_card.order).to eq(second_card_order)
        dupe_card.increment_card_orders!
        order_array = collection_cards.map(&:reload).map(&:order)
        expect(dupe_card.reload.order).to eq(1)
        expect(order_array).to match_array([0, 2, 3, 4, 5])
      end
    end
  end

  context 'archiving' do
    let(:collection) { create(:collection) }
    let!(:collection_card_list) { create_list(:collection_card, 5, parent: collection) }
    let(:collection_cards) { collection.collection_cards }
    let(:collection_card) { collection_cards.first }

    describe '#decrement_card_orders!' do
      before do
        # Make sure cards are in sequential order
        collection.reorder_cards!
      end

      it 'should decrement all orders by 1' do
        collection_cards.first.decrement_card_orders!
        order_arr = collection_cards.map(&:reload).map(&:order)
        # technically you'd do this while archiving card 0, so it would get removed
        expect(order_arr).to match_array([0, 0, 1, 2, 3])
      end

      it 'should return true if success' do
        expect(collection_cards.last.decrement_card_orders!).to be true
      end
    end

    describe 'archive!' do
      it 'archive and call decrement_card_orders' do
        expect(CollectionCard).to receive(:decrement_counter)
        collection_card.archive!
        expect(collection_card.archived?).to be true
      end
    end
  end
end
