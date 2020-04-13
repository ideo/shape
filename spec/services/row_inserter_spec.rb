require 'rails_helper'

RSpec.describe RowInserter, type: :service do
  let(:num_cards) { 6 }
  let(:user) { create(:user) }
  let(:collection) { create(:board_collection, num_cards: num_cards, add_viewers: [user]) }
  let(:cards) { collection.collection_cards }
  let(:action) { :insert_row }
  let(:row) { 1 }
  let(:inserter) do
    RowInserter.new(
      row: row,
      collection: collection,
      action: action,
    )
  end

  before do
    # Row 1 (where selected card is)
    cards[0].update(width: 2, height: 1, row: 1, col: 1)
    cards[1].update(width: 1, height: 1, row: 1, col: 3)
    cards[2].update(width: 1, height: 1, row: 1, col: 4)

    # Row 2
    cards[3].update(width: 3, height: 1, row: 2, col: 1)

    # Row 3
    cards[4].update(width: 1, height: 1, row: 3, col: 1)
    cards[5].update(width: 1, height: 1, row: 3, col: 3)
  end

  it 'inserts a row below the row passed in' do
    inserter.call
    cards.reload
    expect(cards[1].row).to eq 1
    expect(cards[3].row).to eq 3
    expect(cards[5].row).to eq 4
  end

  context 'when removing a row' do
    let(:row) { 2 }
    let(:action) { :remove_row }

    before do
      # Row 3
      cards[4].update(width: 1, height: 1, row: 4, col: 1)
      cards[5].update(width: 1, height: 1, row: 4, col: 3)
    end

    it 'removes the row passed in' do
      inserter.call
      cards.reload
      expect(cards[3].row).to eq 2
      expect(cards[5].row).to eq 3
    end
  end
end
