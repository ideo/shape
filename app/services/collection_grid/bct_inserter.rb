# insert or remove a 1x1 square on the foamcore grid
module CollectionGrid
  class BctInserter < SimpleService
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
      move_other_cards
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

    def move_other_cards
      moving_cards = select_cards_after
      return if moving_cards.none?

      # trying to place these cards back on row/col will collision detect and rearrange appropriately
      CollectionGrid::BoardPlacement.call(
        moving_cards: moving_cards,
        to_collection: @collection,
        row: @row,
        col: @col,
      )
      moving_cards = moving_cards.select(&:changed?)
      return if moving_cards.none?

      moving_cards.each do |cc|
        puts "*** moving #{cc.id} from #{cc.row_was},#{cc.col_was} -> #{cc.row},#{cc.col}"
        @card_attributes_was << {
          id: cc.id,
          row: cc.row_was,
          col: cc.col_was,
        }
        @card_attributes << {
          id: cc.id,
          row: cc.row,
          col: cc.col,
        }
      end
      @placeholder.update(
        parent_snapshot: {
          collection_cards_attributes: @card_attributes_was,
        },
      )
      # use this service so that template updates also flow through
      CollectionUpdater.call(@collection, collection_cards_attributes: @card_attributes)
      broadcaster.card_attrs_updated(@card_attributes)
    end

    def broadcaster
      CollectionUpdateBroadcaster.new(@collection)
    end

    def select_cards_after
      cards_scope = @collection.all_collection_cards.active.where.not(id: @placeholder.id)

      cards_scope = begin
        cards_scope
          .where(
            CollectionCard.arel_table[:row].gt(@row),
          )
          .or(
            cards_scope
              .where(
                CollectionCard.arel_table[:row].eq(@row),
              )
              .where(
                CollectionCard.arel_table[:col].gteq(@col),
              ),
          )
      end

      if @collection.templated?
        cards_scope = cards_scope.where(CollectionCard.arel_table[:pinned].eq(false))
      end

      cards_scope.ordered_row_col
    end
  end
end
