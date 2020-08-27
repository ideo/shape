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
      move_placeholder_cards
      @placeholders
    end

    private

    def insert_placeholder_cards
      # first create the placeholder in the spot that it should take
      next_row = @row
      @count.times do
        placeholder = CollectionCard::Placeholder.create(
          row: next_row,
          col: @col,
          width: 1,
          height: 1,
          parent: @collection,
        )
        @placeholders << placeholder
      end
      # broadcast updates
      # broadcaster.card_updated(@placeholder)
    end

    def move_placeholder_cards
      # trying to place these cards back on row/col will collision detect and rearrange appropriately
      CollectionGrid::BoardPlacement.call(
        row: @row,
        col: @col,
        to_collection: @collection,
        moving_cards: @placeholders,
      )

      # parent_snapshot = { collection_cards_attributes: [] }
      # moving_cards.each do |cc|
      #   @card_attributes << {
      #     id: cc.id,
      #     row: cc.row,
      #     col: cc.col,
      #   }
      #   parent_snapshot[:collection_cards_attributes] << {
      #     id: cc.id,
      #     row: cc.row,
      #     col: cc.col,
      #     row_was: cc.row_was,
      #     col_was: cc.col_was,
      #   }
      # end
      # @placeholder.update(parent_snapshot: parent_snapshot)
      # use this service so that template updates also flow through
      # CollectionUpdater.call(@collection, collection_cards_attributes: @card_attributes)
      # broadcaster.card_attrs_updated(@card_attributes)
    end

    def broadcaster
      CollectionUpdateBroadcaster.new(@collection)
    end
  end
end
