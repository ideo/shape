require 'rails_helper'

RSpec.describe CollectionCardDuplicator, type: :service do
  describe '#call' do
    let(:user) { create(:user) }
    let!(:from_collection) { create(:collection, num_cards: 3, add_viewers: [user]) }
    let(:default_moving_cards) { from_collection.collection_cards.first(2) }
    let(:moving_cards) { default_moving_cards }
    let!(:to_collection) do
      create(:collection, num_cards: 3, add_editors: [user])
    end
    let(:placement) { 'beginning' }
    let(:synchronous) { :async }
    let(:building_template_instance) { false }
    let(:service) do
      CollectionCardDuplicator.new(
        to_collection: to_collection,
        cards: moving_cards,
        placement: placement,
        for_user: user,
        synchronous: synchronous,
        building_template_instance: building_template_instance,
      )
    end

    it 'creates Placeholder cards that point to the originals' do
      expect(moving_cards.map(&:parent_id).uniq).to match_array [from_collection.id]
      new_cards = service.call

      first_cards = to_collection.reload.collection_cards.first(2)
      # newly created cards should be duplicates
      expect(first_cards).to match_array new_cards
      # should point back to original items
      expect(first_cards.map(&:item)).to match_array moving_cards.map(&:item)
      expect(first_cards.all?(&:placeholder?)).to be true
      expect(to_collection.collection_cards.count).to eq 5
    end

    it 'calls CardDuplicatorMapperFindLinkedCardsWorker to map cards' do
      expect(CardDuplicatorMapperFindLinkedCardsWorker).to receive(:perform_async).with(
        instance_of(String), # batch id
        instance_of(Array), # new card ids
        user.id,
        false,
      )
      service.call
    end

    it 'calls CollectionCardDuplicationWorker to complete the duplication' do
      allow(CollectionCardDuplicationWorker).to receive(:perform_async).and_call_original
      new_cards = service.call
      expect(new_cards.map(&:id)).not_to match_array(moving_cards.map(&:id))
      expect(CollectionCardDuplicationWorker).to have_received(:perform_async).with(
        instance_of(String), # batch id
        new_cards.map(&:id), # new card ids
        to_collection.id,
        user.id,
        false, # system collection
        false, # synchronous
        false, # building_template_instance
      )
    end

    it 'calls ActivityAndNotificationWorker for each duplicated card' do
      moving_cards.each do |card|
        expect(ActivityAndNotificationWorker).to receive(:perform_async).with(
          user.id,
          card.id,
          :duplicated,
          from_collection.id,
          to_collection.id,
        )
      end
      service.call
    end

    context 'duplicating from a template' do
      before do
        from_collection.update(master_template: true)
        moving_cards.each { |c| c.update(pinned: true) }
      end

      it 'calls ActivityAndNotificationWorker if you are duplicating a template' do
        moving_cards.each do
          expect(ActivityAndNotificationWorker).to receive(:perform_async)
        end
        service.call
      end

      context 'moving into an unpinned area' do
        it 'creates Placeholder cards that are not pinned' do
          new_cards = service.call
          expect(new_cards.all?(&:placeholder?)).to be true
          expect(new_cards.any?(&:pinned?)).to be false
        end
      end

      context 'moving into a pinned area' do
        before do
          to_collection.update(master_template: true)
          to_collection.collection_cards.each { |c| c.update(pinned: true) }
        end
        it 'creates Placeholder cards that are pinned' do
          new_cards = service.call
          expect(new_cards.all?(&:placeholder?)).to be true
          expect(new_cards.all?(&:pinned?)).to be true
        end
      end

      context 'building template instance' do
        let(:building_template_instance) { true }

        it 'does not call ActivityAndNotificationWorker' do
          expect(ActivityAndNotificationWorker).not_to receive(:perform_async)
          service.call
        end

        it 'creates Placeholder cards that are pinned like the originals' do
          new_cards = service.call
          expect(new_cards.all?(&:placeholder?)).to be true
          expect(new_cards.all?(&:pinned?)).to be true
        end

        it 'passes building_template_instance to CollectionCardDuplicationWorker' do
          expect(CollectionCardDuplicationWorker).to receive(:perform_async).with(
            instance_of(String), # batch id
            instance_of(Array), # new card ids
            to_collection.id,
            user.id,
            false, # system collection
            false, # synchronous
            true, # building_template_instance
          )
          service.call
        end
      end
    end

    context 'duplicating into a template' do
      let!(:to_collection) do
        create(:collection, master_template: true, pin_cards: true, num_cards: 3, add_editors: [user])
      end

      it 'creates pinned Placeholder cards' do
        new_cards = service.call
        # newly created cards should be duplicates
        expect(new_cards.all?(&:placeholder?)).to be true
        expect(new_cards.all?(&:pinned?)).to be true
      end
    end

    context 'if synchronous is all levels' do
      let!(:synchronous) { :all_levels }

      it 'calls CollectionCardDuplicationWorker synchronously' do
        expect(CollectionCardDuplicationWorker).to receive(:perform_sync).with(
          instance_of(String), # batch id
          moving_cards.map(&:id), # existing card ids
          to_collection.id,
          user.id,
          false, # system collection
          true, # synchronous
          false, # building_template_instance
        )
        service.call
      end
    end

    context 'if synchronous is first level' do
      let!(:synchronous) { :first_level }

      it 'calls CollectionCardDuplicationWorker synchronously, but async sub-processes' do
        expect(CollectionCardDuplicationWorker).to receive(:perform_sync).with(
          instance_of(String), # batch id
          moving_cards.map(&:id), # existing card ids
          to_collection.id,
          user.id,
          false, # system collection
          false, # synchronous
          false, # building_template_instance
        )
        service.call
      end
    end

    context 'with integer order' do
      let(:placement) { 1 }

      it 'duplicates cards starting at the specified order' do
        new_cards = service.call
        expect(new_cards.map(&:order)).to eq [1, 2]
        expect(to_collection.collection_cards.pluck(:type, :order)).to eq([
          ['CollectionCard::Primary', 0],
          ['CollectionCard::Placeholder', 1],
          ['CollectionCard::Placeholder', 2],
          ['CollectionCard::Primary', 3],
          ['CollectionCard::Primary', 4],
        ])
      end
    end

    context 'when to_collection is a foamcore board' do
      let!(:to_collection) { create(:board_collection, add_editors: [user]) }
      let(:placement) { 'end' }
      let(:new_cards) { service.call }

      it 'sets row of duplicated cards 2 rows after the last non-blank row' do
        target_empty_row = to_collection.empty_row_for_moving_cards
        new_cards.each_with_index do |card, index|
          expect(card.parent_id).to eq to_collection.id
          expect(card.row).to eq target_empty_row
          expect(card.col).to eq index
        end
      end

      context 'with placement as row/col values, moving to a foamcore board' do
        let(:placement) { Hashie::Mash.new(row: 2, col: 3) }

        it 'moves cards to targeted area' do
          # they are all 1x1 so should fit consecutively
          new_cards.each_with_index do |card, index|
            expect(card.parent_id).to eq to_collection.id
            expect(card.row).to eq 2
            expect(card.col).to eq 3 + index
          end
        end
      end

      context 'when from_collection is a foamcore board' do
        let!(:from_collection) { create(:board_collection, num_cards: 3, add_viewers: [user]) }
        let(:placement) { Hashie::Mash.new(row: 2, col: 3) }

        before do
          moving_cards.each_with_index do |card, index|
            card.update(
              row: index * 2,
              col: index * 2,
            )
          end
        end

        it 'moves cards to targeted area' do
          # they are all 1x1 so should fit consecutively
          new_cards.each_with_index do |card, index|
            expect(card.parent_id).to eq to_collection.id
            expect(card.row).to eq(2 + (index * 2))
            expect(card.col).to eq(3 + (index * 2))
          end
        end
      end
    end
  end
end
