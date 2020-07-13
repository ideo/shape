# This service will set (but not persist) appropriate row/col/parent_id of cards being placed on a Board.
# One reason it does not persist updates is because services may be operating on new records that
# they want to handle saving/creating themselves.
module CollectionGrid
  class BoardPlacement < SimpleService
    def initialize(
      moving_cards:,
      to_collection:,
      from_collection: nil,
      row: nil,
      col: nil
    )
      @to_collection = to_collection
      # e.g. in the case where we're creating a card, from_collection can just equal to_collection
      @from_collection = from_collection || to_collection
      @moving_cards = moving_cards
      @row = row
      @col = col
    end

    def call
      return false unless @to_collection.board_collection?

      CollectionGrid::Calculator.place_cards_on_board(
        row: @row,
        col: @col,
        collection: @to_collection,
        # non-foamcore collections will get converted to rows/cols inside this method
        from_collection: @from_collection,
        moving_cards: @moving_cards,
      )
    end
  end
end
