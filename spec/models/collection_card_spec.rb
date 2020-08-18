require 'rails_helper'

RSpec.describe CollectionCard, type: :model do
  context 'validations' do
    it { should validate_presence_of(:parent) }

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

    describe '#board_placement_is_valid?' do
      let!(:parent) { create(:board_collection, num_cards: 1) }
      let(:existing_card) { parent.collection_cards.first }
      let(:card) { build(:collection_card_text, parent: parent) }

      it 'should be invalid if the spot is out of the valid range' do
        card.row = -1
        card.col = -1
        expect(card.board_placement_is_valid?).to be false
        card.row = nil
        card.col = nil
        expect(card.board_placement_is_valid?).to be false
        card.row = 2
        card.col = parent.num_columns + 1
        expect(card.board_placement_is_valid?).to be false
      end

      it 'should be valid if the spot is not taken' do
        existing_card.update(row: 0, col: 0)
        parent.reload
        card.row = 2
        card.col = 2
        expect(card.board_placement_is_valid?).to be true
      end

      it 'should be invalid if the spot is taken' do
        existing_card.update(row: 2, col: 2, width: 2)
        parent.reload
        card.row = 2
        card.col = 3
        expect(card.board_placement_is_valid?).to be false
      end

      it 'should ignore hidden cards' do
        # ignore existing hidden card
        existing_card.update(row: 0, col: 0, hidden: true)
        parent.reload
        card.row = 0
        card.col = 0
        expect(card.board_placement_is_valid?).to be true
        card.hidden = true
        # does not validate hidden cards
        card.row = nil
        card.col = nil
        expect(card.board_placement_is_valid?).to be true
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
        card.update(filter: 'transparent_gray')
        expect do
          card.update(filter: 'transparent_gray', updated_at: Time.current)
        end.not_to change(card.collection, :updated_at)
      end
    end
  end

  describe '#duplicate!' do
    let(:user) { create(:user) }
    let!(:collection_card) { create(:collection_card_text) }
    let(:shallow) { false }
    let(:parent) { collection_card.parent }
    let(:placement) { 'end' }
    let(:system_collection) { false }
    let(:placeholder) { nil }
    let(:duplicate) do
      collection_card.duplicate!(
        for_user: user,
        parent: parent,
        shallow: shallow,
        placement: placement,
        system_collection: system_collection,
        placeholder: placeholder,
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

    context 'when copying into a collection with no cover set' do
      let(:parent) { create(:collection, cached_cover: { 'no_cover': true }) }

      before do
        collection_card.update(is_cover: true)
      end

      it 'should nullify the is cover attribute' do
        expect(duplicate.is_cover).to be false
      end
    end

    context 'when copying into a collection with an existing cover' do
      let(:parent) { create(:collection, cached_cover: { 'no_cover': true }) }
      let(:cover) { create(:collection_card, parent: parent, is_cover: true) }

      before do
        collection_card.update(is_cover: true)
      end

      it 'should nullify the is cover attribute' do
        expect(duplicate.is_cover).to be false
      end
    end

    context 'when copying a cover card into a collection' do
      let(:parent) { create(:collection) }

      before do
        collection_card.update(is_cover: true)
      end

      it 'should keep the is_cover attribute' do
        expect(duplicate.is_cover).to be true
      end
    end

    context 'without user' do
      let(:duplicate_without_user) do
        collection_card.duplicate!(
          shallow: shallow,
          placement: placement,
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
          # TODO: how do we get the amoeba_dup id?
          expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(
            collection.id,
            [anything],
            :duplicate,
          )
          duplicate
        end
      end
    end

    context 'with linked card' do
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

        context 'with master template card duplicating into a template' do
          let(:template) { create(:collection, master_template: true) }
          let!(:collection_card) { create(:collection_card_text, pinned: true, parent: template) }
          let(:templated) { create(:collection, template: template) }
          let(:duplicate) do
            collection_card.duplicate!(
              for_user: user,
              parent: templated,
              building_template_instance: true,
            )
          end

          it 'should set templated_from' do
            expect(duplicate.templated_from).to eq collection_card
          end
        end

        context 'building a template instance' do
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

    context 'with placeholder' do
      let!(:placeholder) { create(:collection_card_placeholder, item_id: 99, order: 5) }
      let(:placement) { placeholder.order }

      it 'should turn the placeholder into a primary card' do
        expect(duplicate.id).to eq placeholder.id
        expect(duplicate.order).to eq 5
        expect(duplicate.primary?).to be true
      end

      it 'should create a new item and nullify the previous item_id' do
        expect {
          duplicate
        }.to change(Item, :count).by(1)
        expect(duplicate.item_id).not_to eq 99
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

  # context 'card order' do
  #   let(:collection) { create(:collection) }
  #   let!(:collection_card_list) { create_list(:collection_card, 5, parent: collection) }
  #   let(:collection_cards) { collection.collection_cards }
  #
  #   describe '#increment_card_orders!' do
  #     before do
  #       # Make sure cards are in sequential order
  #       collection.reorder_cards!
  #     end
  #
  #     it 'should increment all orders by 1' do
  #       collection_cards.first.increment_card_orders!
  #       order_arr = collection_cards.map(&:reload).map(&:order)
  #       expect(order_arr).to match_array([0, 2, 3, 4, 5])
  #     end
  #
  #     it 'should return true if success' do
  #       expect(collection_cards.first.increment_card_orders!).to be true
  #     end
  #
  #     context 'with another card created at same order as existing' do
  #       let(:second_card_order) { collection.collection_cards[1].order }
  #       let!(:dupe_card) do
  #         create(:collection_card, parent: collection, order: second_card_order)
  #       end
  #
  #       it 'should increment all cards by 1, and leave dupe card' do
  #         expect(dupe_card.order).to eq(second_card_order)
  #         dupe_card.increment_card_orders!
  #         order_array = collection_cards.map(&:reload).map(&:order)
  #         expect(dupe_card.reload.order).to eq(1)
  #         expect(order_array).to match_array([0, 2, 3, 4, 5])
  #       end
  #     end
  #   end
  #
  #   describe '#reorder_cards!' do
  #     before do
  #       collection_cards[2].update(pinned: true, order: 99)
  #       collection_cards[0].update(order: 2)
  #       collection_cards[3].update(order: 3)
  #       collection_cards[4].update(order: 4)
  #       collection_cards[1].update(order: 10)
  #     end
  #
  #     it 'reorders cards sequentially, always putting pinned cards first' do
  #       collection.reorder_cards!
  #       collection.reload
  #       expect(collection.collection_cards.pluck(:id, :order)).to eq(
  #         [
  #           [collection_cards[2].id, 0],
  #           [collection_cards[0].id, 1],
  #           [collection_cards[3].id, 2],
  #           [collection_cards[4].id, 3],
  #           [collection_cards[1].id, 4],
  #         ],
  #       )
  #     end
  #   end
  #
  #   describe '#move_to_order' do
  #     let(:moving_card) { collection_cards.fourth }
  #     before do
  #       # Make sure cards are in sequential order
  #       collection.reorder_cards!
  #     end
  #
  #     it 'should move the card to the specified order and keep things sequential' do
  #       moving_card.move_to_order(1)
  #       expect(collection.collection_cards.map(&:order)).to eq [0, 1, 2, 3, 4]
  #       expect(moving_card.order).to eq 1
  #     end
  #   end
  # end

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

    context 'setting is_cover to false from nil' do
      before do
        current_cover.update(is_cover: nil)
      end

      it 'should not affect no_cover setting' do
        expect(collection.cached_cover['no_cover']).to be false
        current_cover.update(is_cover: false)
        expect(collection.cached_cover['no_cover']).to be false
      end
    end
  end

  describe '#update_collection_background' do
    # give this one a parent so it has a parent card
    let!(:collection) { create(:collection, parent_collection: create(:collection)) }
    let!(:image_item) do
      create(:collection_card_image, parent: collection, section_type: 'background', is_background: true)
    end
    # new_background is lazy evaluated on purpose so we can test what happens when created
    let(:new_background) do
      create(:collection_card_image, parent: collection, section_type: 'background', is_background: true)
    end

    context 'creating a new background image' do
      it 'should set collection background_image_url' do
        expect(collection.background_image_url).to eq image_item.item.filestack_file_url
      end
    end

    context 'setting a new background image' do
      it 'should touch collection and unset any other cards is_background attribute' do
        expect {
          new_background
        }.to change(collection.parent_collection_card, :updated_at)
        expect(new_background.reload.is_background).to be true
        expect(image_item.reload.is_background).to be false
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

  describe 'copy_master_card_attributes!' do
    let(:instance_card) { create(:collection_card, order: 3, pinned: true, width: 2, height: 1, col: 1, row: 1) }
    let(:master_card) { create(:collection_card, order: 1, pinned: false, width: 1, height: 2, col: 2, row: 2) }

    it 'should copy card attributes' do
      expect {
        instance_card.copy_master_card_attributes!(master_card)
      }.to change(instance_card, :updated_at)
      expect(instance_card.height).to eq(master_card.height)
      expect(instance_card.width).to eq(master_card.width)
      expect(instance_card.pinned).to eq(master_card.pinned)
      expect(instance_card.order).to eq(master_card.order)
      expect(instance_card.row).to eq(master_card.row)
      expect(instance_card.col).to eq(master_card.col)
    end

    context 'with an unpinned master_card created a while ago' do
      it 'should not copy all attributes' do
        master_card.update(created_at: 3.days.ago, pinned: false)
        instance_card.copy_master_card_attributes!(master_card)
        expect(instance_card.height).not_to eq(master_card.height)
        expect(instance_card.width).not_to eq(master_card.width)
        expect(instance_card.row).not_to eq(master_card.row)
        expect(instance_card.col).not_to eq(master_card.col)
        # this should always match
        expect(instance_card.pinned).to eq(master_card.pinned)
      end
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
        collection.update(num_columns: nil)
        collection.reorder_cards!
      end

      it 'should decrement all orders by 1' do
        order_arr = collection_cards.reload.map(&:order)
        expect(order_arr).to match_array([0, 1, 2, 3, 4])
        collection_cards.first.decrement_card_orders!
        order_arr = collection_cards.reload.map(&:order)
        # technically you'd do this while archiving card 0, so it would get removed
        expect(order_arr).to match_array([0, 0, 1, 2, 3])
      end

      it 'should return true if success' do
        expect(collection_cards.last.decrement_card_orders!).to be true
      end
    end

    describe '#archive!' do
      it 'should archive' do
        collection_card.archive!
        expect(collection_card.archived?).to be true
      end

      it 'should decrement parent cached_card_count' do
        expect(collection.reload.cached_card_count).to eq 5
        collection_card.archive!
        expect(collection.reload.cached_card_count).to eq 4
      end

      context 'with test collection (no columns)' do
        let(:collection) { create(:test_collection, num_cards: 1) }

        it 'should archive and call decrement_card_orders' do
          expect(CollectionCard).to receive(:decrement_counter)
          collection_card.archive!
          expect(collection_card.archived?).to be true
        end
      end
    end

    describe '#archive_all!' do
      let(:user) { create(:user) }

      it 'should archive all cards in the query' do
        expect do
          collection_cards.archive_all!(ids: collection.collection_cards.pluck(:id), user_id: user.id)
          collection.reload
        end.to change(CollectionCard.active, :count)
          .by(collection_cards.count * -1)
          .and(change(collection, :updated_at))
        expect(collection.collection_cards).to eq []
      end

      it 'should call the CollectionCardArchiveWorker' do
        card_ids = collection.collection_cards.pluck(:id)
        expect(CollectionCardArchiveWorker).to receive(:perform_async).with(
          card_ids,
          user.id,
        )
        collection_cards.archive_all!(ids: card_ids, user_id: user.id)
      end

      context 'with a master template collection with 1 or more instances' do
        let(:collection) { create(:collection, master_template: true, num_cards: 2) }
        let!(:instance) { create(:collection, template: collection) }

        it 'should call the UpdateTemplateInstancesWorker' do
          expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(
            collection.id,
            collection.collection_cards.pluck(:id),
            :archive,
          )
          collection_cards.archive_all!(ids: collection.collection_cards.pluck(:id), user_id: user.id)
        end
      end
    end
  end
end
