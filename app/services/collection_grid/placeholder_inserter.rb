module CollectionGrid
  class PlaceholderInserter < SimpleService
    # attr_reader :placeholders, :card_attributes, :card_attributes_was
    attr_reader :placeholders

    def initialize(
      row: 0,
      col: 0,
      count: 0,
      collection:
    )
      @placeholders = []
      @row = row
      @col = col
      @count = count
      @collection = collection

      @card_attributes_was = []
      @card_attributes = []
    end

    def call
      insert_placeholder_cards
      return [] unless @placeholders.present?

      move_placeholder_cards
      @placeholders
    end

    private

    def insert_placeholder_cards
      # first create the placeholder in the spot that it should take
      @count.times do
        placeholder = CollectionCard::Placeholder.create(
          row: @row,
          col: @col,
          width: 1,
          height: 1,
          parent: @collection,
        )
        @placeholders << placeholder
      end
    end

    def move_placeholder_cards
      # trying to place these cards back on row/col will collision detect and rearrange appropriately
      CollectionGrid::BoardPlacement.call(
        row: @row,
        col: @col,
        to_collection: @collection,
        moving_cards: @placeholders,
      )
    end
  end
end
