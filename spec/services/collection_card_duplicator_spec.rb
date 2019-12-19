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
    let(:service) do
      CollectionCardDuplicator.new(
        to_collection: to_collection,
        cards: moving_cards,
        placement: placement,
        for_user: user,
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

    it 'calls CollectionCardMapperAndDuplicationWorker to finish processing the job' do
      expect(CollectionCardMapperAndDuplicationWorker).to receive(:perform_async).with(
        instance_of(String), # batch id
        instance_of(Array), # new card ids
        to_collection.id,
        user.id,
        false,
      )
      service.call
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
      let!(:to_collection) { create(:board_collection, num_cards: 3, add_editors: [user]) }
      let(:new_cards) { service.call }
      let(:target_empty_row) { to_collection.empty_row_for_moving_cards }

      it 'sets row of duplicated cards 2 rows after the last non-blank row' do
        new_cards.each_with_index do |card, index|
          expect(card.parent_id).to eq to_collection.id
          expect(card.row).to eq target_empty_row
          expect(card.col).to eq index
        end
      end
    end

    context 'with data items that have legends' do
      let!(:data_item) do
        create(
          :data_item,
          :report_type_record,
          parent_collection: from_collection,
        )
      end
      let(:legend_item) { data_item.legend_item }
      let(:duplicated_data_items) { to_collection.items.data_items }
      let!(:moving_cards) { default_moving_cards + [data_item.parent_collection_card] }
      before do
        legend_item.reload # to make sure data_item_ids aren't cached
        user.add_role(Role::EDITOR, data_item)
        Sidekiq::Testing.inline!
      end

      after do
        Sidekiq::Testing.fake!
      end

      it 'links legend to duplicated data item' do
        service.call
        to_collection.reload.collection_cards
        expect(from_collection.items.data_items.size).to eq(1)
        expect(duplicated_data_items.size).to eq(1)
        expect(duplicated_data_items.first.cloned_from).to eq(data_item)
      end

      context 'if legend is not selected' do
        it 'duplicates legend' do
          expect(moving_cards).not_to include(legend_item.parent_collection_card)
          expect {
            service.call
          }.to change(Item::LegendItem, :count).by(1)
        end
      end

      context 'if legend is selected' do
        let!(:moving_cards) { default_moving_cards + [legend_item.parent_collection_card] }

        it 'duplicates it' do
          expect {
            service.call
          }.to change(Item::LegendItem, :count).by(1)
        end
      end

      context 'with legend linked to other data items not duplicated' do
        let!(:data_item_two) do
          create(
            :data_item,
            :report_type_record,
            parent_collection: from_collection,
            legend_item: legend_item,
          )
        end

        before do
          user.add_role(Role::EDITOR, data_item_two)
        end

        it 'duplicates legend' do
          expect {
            service.call
          }.to change(Item::LegendItem, :count).by(1)
        end

        it 'leaves existing data item linked to legend item' do
          service.call
          to_collection_legend_items = to_collection.collection_cards.reload.select do |card|
            card.item&.is_a?(Item::LegendItem)
          end.map(&:item)
          expect(
            to_collection_legend_items.size,
          ).to eq(1)
          duplicated_legend_item = to_collection_legend_items.first
          expect(data_item_two.reload.legend_item).not_to eq(duplicated_legend_item)
        end
      end
    end
  end
end
