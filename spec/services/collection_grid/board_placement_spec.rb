require 'rails_helper'

RSpec.describe CollectionGrid::BoardPlacement, type: :service do
  let(:from_collection) { create(:collection, num_cards: 2) }
  let(:to_collection) { create(:board_collection) }
  let(:moving_cards) { from_collection.collection_cards }
  let(:row) { nil }
  let(:col) { nil }

  let(:service) do
    CollectionGrid::BoardPlacement.new(
      from_collection: from_collection,
      to_collection: to_collection,
      moving_cards: moving_cards,
      row: row,
      col: col,
    )
  end

  describe '#call' do
    context 'with no row/col specified' do
      it 'should place them in the next empty row' do
        target_empty_row = to_collection.empty_row_for_moving_cards
        service.call
        # they are all 1x1 so should fit consecutively
        moving_cards.each_with_index do |card, index|
          expect(card.parent_id).to eq to_collection.id
          expect(card.row).to eq target_empty_row
          expect(card.col).to eq index
        end
      end
    end

    context 'specifying a row/col placement' do
      let(:from_collection) { create(:board_collection, num_cards: 2) }
      let(:row) { 2 }
      let(:col) { 3 }

      before do
        moving_cards.each_with_index do |card, index|
          card.update(row: 0, col: index)
        end
      end

      it 'should place them according to the row/col indicated' do
        service.call
        moving_cards.each_with_index do |card, index|
          expect(card.parent_id).to eq to_collection.id
          expect(card.row).to eq 2
          expect(card.col).to eq 3 + index
        end
      end
    end
  end
end
