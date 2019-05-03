require 'rails_helper'

describe Collection::Board, type: :model do
  describe '#allowed_col_range' do
    it 'is the range of 0..COLS' do
      expect(Collection::Board.allowed_col_range).to eq(
        0..(Collection::Board::COLS - 1)
      )
    end
  end
end
