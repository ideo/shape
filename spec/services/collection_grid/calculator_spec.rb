require 'rails_helper'

RSpec.describe CollectionGrid::Calculator, type: :service do
  # this is intentionally written similar to CollectionGridCalculator frontend test
  describe '#calculate_rows_cols' do
    let(:collection) { create(:collection, num_cards: 8) }
    let(:cards) { collection.collection_cards }

    before do
      cards[0].update(width: 1, height: 1)
      cards[1].update(width: 2, height: 2)
      cards[2].update(width: 1, height: 2)
      cards[3].update(width: 1, height: 1)
      cards[4].update(width: 3, height: 1)
      cards[5].update(width: 2, height: 1)
      cards[6].update(width: 2, height: 2)
      cards[7].update(width: 1, height: 1)
    end

    it 'should calculate the 4 column layout of the given cards' do
      CollectionGrid::Calculator.calculate_rows_cols(cards)
      # col, row to match x, y on frontend
      expect(cards.pluck(:col, :row)).to eq([
        [0, 0],
        [1, 0],
        [3, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [2, 3],
        [0, 4],
      ])
    end
  end

  describe '#foamcore_collision' do
    let(:collection) { create(:board_collection, num_cards: 8) }
    let(:from_collection) { create(:board_collection) }
    let(:cards) { collection.collection_cards }
    let(:moving_cards) { create_list(:collection_card, 4) }

    before do
      cards[0].update(row: 0, col: 0, width: 4, height: 1)
      cards[1].update(row: 1, col: 0, width: 1, height: 2)
      cards[2].update(row: 1, col: 1, width: 1, height: 1)
      cards[3].update(row: 1, col: 2, width: 1, height: 2)
      cards[4].update(row: 1, col: 4, width: 1, height: 1)
      cards[5].update(row: 2, col: 2, width: 2, height: 1)
      moving_cards[0].update(row: 3, col: 5)
      moving_cards[1].update(row: 3, col: 6)
      moving_cards[2].update(row: 3, col: 7)
      moving_cards[3].update(row: 4, col: 5)
    end

    it 'should insert cards into the layout without collision' do
      CollectionGrid::Calculator.foamcore_collision(
        row: 1,
        col: 3,
        master_card: moving_cards[0],
        collection: collection,
        from_collection: from_collection,
        moving_cards: moving_cards,
      )
      expect(moving_cards.pluck(:row, :col)).to eq([
        [2, 1],
        [1, 3],
        [1, 5],
        [2, 5],
      ])
    end
  end
end
