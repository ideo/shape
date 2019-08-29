class CollectionCardDuplicator < SimpleService
  def initialize(to_collection:, cards:, placement:, for_user:, system_collection: false)
    @to_collection = to_collection
    @cards = cards
    @placement = placement
    @for_user = for_user
    @system_collection = system_collection
    @new_cards = []
    @should_update_cover = false
  end

  def call
    duplicate_cards
    duplicate_legend_items
    reorder_and_cache_covers
    @new_cards
  end

  private

  def duplicate_cards
    # reverse cards for 'beginning' or dropping into a particular order,
    # since they get duplicated one by one to the front
    if @placement != 'end'
      @cards = @cards.reverse
    end
    target_empty_row = @to_collection.empty_row_for_moving_cards

    @cards.each_with_index do |card, i|
      # Skip if legend item - they will be moved over in `duplicate_legend_items`
      next if card.item&.is_a?(Item::LegendItem)

      dup = card.duplicate!(
        for_user: @for_user,
        parent: @to_collection,
        placement: @placement,
        duplicate_linked_records: true,
        system_collection: @system_collection,
      )

      if @to_collection.is_a? Collection::Board
        dup.update(row: target_empty_row, col: i)
      end

      @should_update_cover ||= dup.should_update_parent_collection_cover?
      @new_cards << dup
    end
  end

  def reorder_and_cache_covers
    @to_collection.reorder_cards!
    @to_collection.cache_cover! if @should_update_cover
  end

  def duplicate_legend_items
    mover = LegendMover.new(
      to_collection: @to_collection,
      cards: (@to_collection.collection_cards + @new_cards).uniq,
      action: 'duplicate',
    )

    return unless mover.call

    @new_cards += mover.legend_item_cards
  end
end
