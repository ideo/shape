require 'rails_helper'

RSpec.describe CollectionGrid::BctInserter, type: :service do
  let(:collection) { create(:board_collection) }
  let(:row) { nil }
  let(:col) { nil }

  let(:service) do
    CollectionGrid::BctInserter.new(
      row: row,
      col: col,
      collection: collection,
    )
  end
  let(:placeholder) do
    service.call
  end

  describe '#call' do
    context 'with other cards in the way' do
      let(:collection) { create(:board_collection, num_columns: 4, num_cards: 3) }
      let(:cards) { collection.collection_cards }
      let(:row) { 0 }
      let(:col) { 2 }

      before do
        # [ 0 0 1 1 ]
        # [ x 2 2 x ]
        cards[0].update(row: 0, col: 0, width: 2)
        cards[1].update(row: 0, col: 2, width: 2)
        cards[2].update(row: 1, col: 1, width: 2)
      end

      it 'saves the prior snapshot of the moved cards' do
        expect(placeholder.parent_snapshot).to eq({
          collection_cards_attributes: [
            { id: cards[1].id, row: 0, col: 2 },
            { id: cards[2].id, row: 1, col: 1 },
          ],
        }.as_json)
      end

      it 'moves cards appropriately' do
        placeholder
        # should have gotten bumped down
        # [ 0 0 p p ]
        # [ 1 1 2 2 ]
        cards.reload
        expect(cards.second.id).to eq placeholder.id
        expect(cards.pluck(:row, :col)).to eq([
          [0, 0],
          [0, 2],
          [1, 0],
          [1, 2],
        ])
      end
    end
  end
end
