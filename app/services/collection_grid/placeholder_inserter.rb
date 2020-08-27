module CollectionGrid
  class PlaceholderInserter < SimpleService
    attr_reader :placeholder, :card_attributes, :card_attributes_was

    def initialize(
      row: 0,
      col: 0,
      collection:
    )
      @row = row
      @col = col
      @collection = collection

      @card_attributes_was = []
      @card_attributes = []
    end

    def call
      insert_bct_square
      move_placeholder_cards
      @placeholder
    end

    private

    def insert_bct_square
      # first create the placeholder in the spot that it should take
      @placeholder = CollectionCard::Placeholder.create(
        row: @row,
        col: @col,
        width: 1,
        height: 1,
        parent: @collection,
      )
      # broadcast updates
      broadcaster.card_updated(@placeholder)
    end

    def move_placeholder_cards
      # trying to place these cards back on row/col will collision detect and rearrange appropriately
      CollectionGrid::BoardPlacement.call(
        row: @row,
        col: @col,
        to_collection: @collection,
        moving_cards: [@placeholder],
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
