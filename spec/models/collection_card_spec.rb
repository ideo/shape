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

  describe 'callbacks' do
    describe '#set_collection_as_master_template' do
      context 'with regular collection' do
        let(:collection) { create(:collection) }

        it 'should not set master_template' do
          expect(collection.reload.master_template?).to be false
        end
      end

      context 'with test collection' do
        let(:collection) { create(:test_collection, num_cards: 3) }

        it 'should not set master_template' do
          expect(collection.reload.master_template?).to be false
        end

        it 'should not pin cards' do
          expect(collection.primary_collection_cards.any?(&:pinned?)).to be false
        end

        context 'parent is master template' do
          before do
            collection.update(master_template: true)
            collection.reload
          end

          it 'sets master_template = true' do
            expect(collection.master_template?).to be true
          end

          it 'pins all cards' do
            expect(collection.primary_collection_cards.all?(&:pinned?)).to be true
          end
        end
      end
    end

    describe '#touch_collection' do
      let(:card) { create(:collection_card_collection) }

      it 'should touch its collection if filter attribute changed' do
        card.update(filter: 'transparent_gray')
        expect do
          card.update(filter: 'nothing')
        end.to change(card.collection, :updated_at)
      end

      it 'should not touch its collection if filter attribute did not change' do
        expect do
          card.update(height: 2)
        end.not_to change(card.collection, :updated_at)
      end
    end
  end

  describe '#duplicate!' do
    let(:user) { create(:user) }
    let!(:collection_card) { create(:collection_card_text) }
    let(:shallow) { false }
    let(:duplicate_linked_records) { false }
    let(:placement) { 'end' }
    let(:system_collection) { false }
    let(:duplicate) do
      collection_card.duplicate!(
        for_user: user,
        shallow: shallow,
        placement: placement,
        duplicate_linked_records: duplicate_linked_records,
        system_collection: system_collection,
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

    context 'without user' do
      let(:duplicate_without_user) do
        collection_card.duplicate!(
          shallow: shallow,
          placement: placement,
          duplicate_linked_records: duplicate_linked_records,
        )
      end

      it 'should create copy of card' do
        expect { duplicate_without_user }.to change(CollectionCard, :count).by(1)
        expect(duplicate_without_user.id).not_to eq(collection_card.id)
      end

      it 'should duplicate item' do
        expect { duplicate_without_user }.to change(Item, :count).by(1)
      end

      context 'in a master template with 1 or more instances' do
        let(:collection) { collection_card.parent }
        let!(:instance) { create(:collection, template: collection) }

        before do
          collection.update(master_template: true)
        end

        it 'should call the UpdateTemplateInstancesWorker' do
          expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(collection.id)
          duplicate
        end
      end
    end

    context 'with specified order placement' do
      let!(:collection) { create(:collection, num_cards: 3, record_type: :collection) }
      let(:collection_card) { collection.collection_cards.first }
      let(:placement) { 1 }

      it 'should place the duplicate in the middle of the collection' do
        expect(duplicate.order).to eq 1
        expect(collection.collection_cards.second).to eq duplicate
      end
    end

    context 'with pinned card from regular collection' do
      let!(:collection_card) { create(:collection_card_text, pinned: true) }

      it 'should set pinned to false on the duplicate' do
        expect(collection_card.pinned?).to be true
        expect(duplicate.pinned?).to be false
      end
    end

    context 'with pinned card from master template' do
      let(:template) { create(:collection, master_template: true) }
      let!(:collection_card) { create(:collection_card_text, pinned: true, parent: template) }

      it 'should set pinned to true on the duplicate' do
        expect(collection_card.pinned?).to be true
        expect(duplicate.pinned?).to be true
      end

      it 'should set pinned even if original was not pinned' do
        collection_card.update(pinned: false)
        expect(duplicate.pinned?).to be true
      end
    end

    context 'with linked card and duplicate_linked_records = true' do
      let(:parent_collection_card) { create(:collection_card_collection) }
      let(:collection) { parent_collection_card.collection }
      let(:duplicate_linked_records) { true }
      let!(:collection_card) { create(:collection_card_link, collection: collection) }

      it 'should duplicate the underlying linked collection record' do
        expect { duplicate }.to change(Collection, :count).by(1)
        expect(duplicate.primary?).to be true
        expect(duplicate.record.id).not_to eq(collection.id)
      end

      context 'when system_collection is set to true' do
        let(:system_collection) { true }

        it 'should call duplicate on the parent collection card with system_collection true' do
          expect(parent_collection_card).to receive(:duplicate!).with(
            for_user: anything,
            parent: anything,
            shallow: anything,
            placement: anything,
            system_collection: true,
            synchronous: false,
          )
          duplicate
        end
      end
    end

    context 'with linked card and duplicate_linked_records = false' do
      let(:parent_collection_card) { create(:collection_card_collection) }
      let(:collection) { parent_collection_card.collection }
      let!(:collection_card) { create(:collection_card_link, collection: collection) }

      it 'should not duplicate the underlying linked collection record' do
        expect { duplicate }.not_to change(Collection, :count)
        expect(duplicate.link?).to be true
        expect(duplicate.record.id).to eq(collection.id)
      end
    end

    context 'for collection' do
      let!(:collection_card_collection) { create(:collection_card_collection) }
      let(:collection) { collection_card_collection.collection }
      let(:duplicate) do
        collection_card_collection.duplicate!(
          for_user: user,
        )
      end

      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'should duplicate collection' do
        expect { duplicate }.to change(Collection, :count).by(1)
      end

      context 'with a master template collection' do
        before do
          collection.update(master_template: true)
        end

        it 'simply copies the template' do
          expect(duplicate.collection.master_template?).to be true
        end

        context 'inside a template instance' do
          let(:duplicate) do
            collection_card_collection.duplicate!(
              for_user: user,
              building_template_instance: true,
            )
          end

          it 'calls the TemplateBuilder to create an instance of the template' do
            expect(duplicate.collection.master_template?).to be false
            expect(duplicate.collection.template).to eq collection
          end
        end
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

    context 'with placement at beginning' do
      let!(:placement) { 'beginning' }

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
          for_user: user,
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

    context 'with pinned original card' do
      let(:collection_card) { create(:collection_card, pinned: true) }

      it 'should reset the pinned status' do
        expect(collection_card.primary?).to be true
        expect(collection_card.pinned?).to be true
        expect(collection_card_link.new_record?).to be true
        expect(collection_card_link.link?).to be true
        expect(collection_card_link.pinned?).to be false
      end
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

  describe 'should_update_parent_collection_cover?' do
    let(:collection) { create(:collection, num_cards: 3) }
    let(:card) { collection.collection_cards.first }
    let(:last_card) { collection.collection_cards.last }

    it 'should return true if parent cover has not been created' do
      expect(card.should_update_parent_collection_cover?).to be true
      expect(last_card.should_update_parent_collection_cover?).to be true
    end

    it 'should return true if parent cover will be affected by this card' do
      collection.cache_cover!
      # cover text comes from the first card, so it should update
      expect(card.should_update_parent_collection_cover?).to be true
    end

    it 'should return false if parent cover will not be affected by this card' do
      collection.cache_cover!
      # cover text comes from the first card, so last_card shouldn't affect update
      expect(last_card.should_update_parent_collection_cover?).to be false
    end
  end

  describe '#update_collection_cover' do
    let(:collection) { create(:collection) }
    let!(:collection_card_list) { create_list(:collection_card_image, 5, parent: collection) }
    let(:current_cover) { collection_card_list.last }
    let(:new_cover) { collection_card_list.first }

    context 'setting a new collection cover' do
      before do
        current_cover.update_column(:is_cover, true)
      end

      it 'should unset any other cards is_cover attribute' do
        new_cover.update_attribute(:is_cover, true)
        expect(current_cover.reload.is_cover).to be false
      end
    end

    context 'un-setting a collection cover' do
      before do
        # set the cover w/ callbacks
        current_cover.update(is_cover: true)
      end

      it 'should unset any other cards is_cover attribute' do
        expect(collection.cached_cover['no_cover']).to be false
        expect(collection.cached_cover['image_url']).to eq current_cover.item.image_url
        current_cover.update(is_cover: false)
        expect(current_cover.reload.is_cover).to be false
        expect(collection.cached_cover['no_cover']).to be true
        expect(collection.cached_cover['image_url']).to be nil
      end
    end
  end

  describe 'update_parent_card_count!' do
    let(:collection) { create(:collection) }

    it 'should update when creating a card in the collection' do
      collection.cache_card_count!
      expect(collection.cached_card_count).to eq 0
      create(:collection_card, parent: collection)
      expect(collection.cached_card_count).to eq 1
    end
  end

  context 'archiving' do
    let(:collection) { create(:collection, num_cards: 5) }
    # we grab these manually because archiving the cards will alter collection.collection_cards
    let(:collection_cards) { CollectionCard.where(id: collection.collection_cards.map(&:id)) }
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

    describe '#archive!' do
      it 'should archive and call decrement_card_orders' do
        expect(CollectionCard).to receive(:decrement_counter)
        collection_card.archive!
        expect(collection_card.archived?).to be true
      end

      it 'should decrement parent cached_card_count' do
        expect(collection.cached_card_count).to eq 5
        collection_card.archive!
        expect(collection.reload.cached_card_count).to eq 4
      end
    end

    describe '#archive_all!' do
      let(:user) { create(:user) }

      it 'should archive all cards in the query' do
        expect_any_instance_of(Collection).to receive(:touch)
        expect do
          collection_cards.archive_all!(user_id: user.id)
        end.to change(CollectionCard.active, :count).by(collection_cards.count * -1)
        expect(collection.reload.collection_cards).to eq []
      end

      it 'should call the CollectionCardArchiveWorker' do
        expect(CollectionCardArchiveWorker).to receive(:perform_async).with(
          collection_cards.map(&:id),
          user.id,
        )
        collection_cards.archive_all!(user_id: user.id)
      end

      context 'with a master template collection with 1 or more instances' do
        let(:collection) { create(:collection, master_template: true, num_cards: 2) }
        let!(:instance) { create(:collection, template: collection) }

        it 'should call the UpdateTemplateInstancesWorker' do
          expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(collection.id)
          collection_cards.archive_all!(user_id: user.id)
        end
      end
    end
  end
end
