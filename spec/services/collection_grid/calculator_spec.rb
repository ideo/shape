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
end
