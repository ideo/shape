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
    # reverse cards for 'beginning' since they get duplicated one by one to the front
    @cards = @cards.reverse if @placement == 'beginning'
    @cards.each do |card|
      # Skip if legend item - they will be moved over in `duplicate_legend_items`
      next if card.item&.is_a?(Item::LegendItem)

      dup = card.duplicate!(
        for_user: @for_user,
        parent: @to_collection,
        placement: @placement,
        duplicate_linked_records: true,
        system_collection: @system_collection,
      )
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

    @new_cards += mover.new_legend_item_cards
  end
end
