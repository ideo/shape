# insert or remove a 1x1 square on the foamcore grid
module CollectionGrid
  class BctInserter < SimpleService
    attr_reader :placeholder, :card_attributes, :card_attributes_was

    def initialize(
      row: 0,
      col: 0,
      collection:,
      user: nil
    )
      @row = row
      @col = col
      @collection = collection
      @user = user

      @card_attributes_was = []
      @card_attributes = []
    end

    def call
      existing_card = @collection.collection_cards.select { |cc| cc.row == @row && cc.col == @col }
      insert_bct_square
      move_other_cards if existing_card.present?
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

      min_row = moving_cards.minimum(:row)
      if min_row && min_row < @row
        @row = min_row
      end
      # trying to place these cards back on row/col will collision detect and rearrange appropriately
      CollectionGrid::BoardPlacement.call(
        moving_cards: moving_cards,
        to_collection: @collection,
        row: @row,
        col: @col,
      )
      moving_cards = moving_cards.select(&:changed?)
      return if moving_cards.none?

      parent_snapshot = { collection_cards_attributes: [] }
      moving_cards.each do |cc|
        @card_attributes << {
          id: cc.id,
          row: cc.row,
          col: cc.col,
        }
        parent_snapshot[:collection_cards_attributes] << {
          id: cc.id,
          row: cc.row,
          col: cc.col,
          row_was: cc.row_was,
          col_was: cc.col_was,
        }
      end
      @placeholder.update(parent_snapshot: parent_snapshot)
      # use this service so that template updates also flow through
      CollectionUpdater.call(@collection, collection_cards_attributes: @card_attributes)
      broadcaster.card_attrs_updated(@card_attributes)
    end

    def broadcaster
      CollectionUpdateBroadcaster.new(@collection)
    end

    def select_cards_after
      base_cards_scope = @collection.all_collection_cards.active.where.not(id: @placeholder.id)
      cards_scope = base_cards_scope

      tall_cards_to_the_right = cards_scope
                                .where(
                                  CollectionCard.arel_table[:row].eq(@row - 1),
                                )
                                .where(
                                  CollectionCard.arel_table[:col].gteq(@col),
                                )
                                .where(
                                  CollectionCard.arel_table[:height].eq(2),
                                )

      cards_scope = begin
        base_cards_scope
          .where(
            CollectionCard.arel_table[:row].gt(@row),
          )
          .or(
            base_cards_scope
              .where(
                CollectionCard.arel_table[:row].eq(@row),
              )
              .where(
                CollectionCard.arel_table[:col].gteq(@col),
              ),
          )
      end

      if tall_cards_to_the_right.any?
        tall_card_to_the_right = tall_cards_to_the_right.ordered_row_col.first
        cards_scope = cards_scope
                      .or(
                        base_cards_scope
                          .where(
                            CollectionCard.arel_table[:row].eq(tall_card_to_the_right.row),
                          )
                          .where(
                            CollectionCard.arel_table[:col].gteq(tall_card_to_the_right.col),
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
