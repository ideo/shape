# This service will set (but not persist) appropriate row/col/parent_id of cards being placed on a Board.
# One reason it does not persist updates is because services may be operating on new records that
# they want to handle saving/creating themselves.
module CollectionGrid
  class BoardPlacement < SimpleService
    def initialize(
      to_collection:,
      from_collection:,
      moving_cards:,
      row: nil,
      col: nil
    )
      @to_collection = to_collection
      @from_collection = from_collection
      @moving_cards = moving_cards
      @row = row
      @col = col
    end

    def call
      return false unless @to_collection.is_a?(Collection::Board)

      if @from_collection.is_a?(Collection::Board)
        top_left_card = CollectionGrid::Calculator.top_left_card(@moving_cards)
      else
        # calculate row/col values for each of the moving cards
        CollectionGrid::Calculator.calculate_rows_cols(@moving_cards)
        # cards are already ordered
        top_left_card = @moving_cards.first
      end

      if @row && @col
        row_move = @row - top_left_card.row
        col_move = @col - top_left_card.col
      else
        # always "move to end"
        row_move = @to_collection.empty_row_for_moving_cards
        col_move = 0
      end

      @moving_cards.each do |card|
        card.parent_id = @to_collection.id
        card.row += row_move
        card.col += col_move
      end
    end
  end
end
