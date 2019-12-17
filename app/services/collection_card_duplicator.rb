class CollectionCardDuplicator < SimpleService
  def initialize(
    to_collection:,
    cards:,
    placement:,
    for_user:,
    system_collection: false
  )
    @to_collection = to_collection
    @cards = cards
    @placement = placement
    @for_user = for_user
    @system_collection = system_collection
    @new_cards = []
    @should_update_cover = false
  end

  def call
    initialize_card_order
    duplicate_cards
    duplicate_legend_items
    reorder_and_cache_covers
    @new_cards
  end

  private

  def initialize_card_order
    @order = @to_collection.card_order_at(@placement)

    # now make room for these cards (unless we're at the end)
    return if @placement == 'end'

    @to_collection.increment_card_orders_at(@order, amount: @cards.count)
  end

  def duplicate_cards
    @cards.each_with_index do |card, i|
      # Skip if legend item - they will be moved over in `duplicate_legend_items`
      next if card.item&.is_a?(Item::LegendItem)
      # Skip SharedWithMe (not allowed)
      next if card.collection&.is_a?(Collection::SharedWithMeCollection)

      # copy attributes from original, including item/collection_id which will
      # help us refer back to the originals when duplicating
      dup = card.amoeba_dup.becomes(CollectionCard::Placeholder)
      dup.type = 'CollectionCard::Placeholder'
      dup.pinned = @to_collection.master_template?
      dup.order = @order + i
      dup.parent_id = @to_collection.id

      if @to_collection.is_a? Collection::Board
        # TODO: this logic will get fixed/changed with Foamcore collision detection
        target_empty_row ||= @to_collection.empty_row_for_moving_cards
        dup.row = target_empty_row
        dup.col = i
      end

      @new_cards << dup
    end

    CollectionCard.import(@new_cards)
    @to_collection.update_processing_status(:duplicating)
    CollectionCardDuplicationWorker.perform_async(
      @new_cards.map(&:id),
      @to_collection.id,
      @for_user.try(:id),
      @system_collection,
    )
  end

  def reorder_and_cache_covers
    @to_collection.reorder_cards!
    @to_collection.cache_cover!
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
