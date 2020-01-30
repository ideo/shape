class CollectionCardDuplicator < SimpleService
  def initialize(
    to_collection:,
    cards:,
    placement: nil,
    for_user: nil,
    system_collection: false,
    batch_id: nil,
    synchronous: :async,
    placeholders: true,
    building_template_instance: false
  )
    @to_collection = to_collection
    @cards = cards
    @placement = placement
    @placeholders = placeholders
    @for_user = for_user
    @system_collection = system_collection
    @batch_id = batch_id || "duplicate-#{SecureRandom.hex(10)}"
    @new_cards = []
    @should_update_cover = false
    @synchronous = validate_synchronous_value(synchronous)
    @building_template_instance = building_template_instance
  end

  def call
    initialize_card_order
    duplicate_cards_with_placeholders if @synchronous == :async
    register_card_mappings
    deep_duplicate_cards
    reorder_and_cache_covers
    return @new_cards if @synchronous == :async

    # If synchronous, re-assign @new_cards to actual cards, overriding placeholders
    CollectionCard.where(id: @new_cards.map(&:id))
  end

  private

  def validate_synchronous_value(value)
    value = value.to_sym
    valid_options = %i[all_levels first_level async]
    return value if valid_options.include?(value)

    raise "Invalid synchronous option (#{value}) provided to CollectionCardDuplicator. " \
          "Allowed values are: #{valid_options.join(', ')}"
  end

  def initialize_card_order
    @order = 0
    if @placement.is_a?(String) || @placement.is_a?(Integer)
      @order = @to_collection.card_order_at(@placement)
    elsif @placement.respond_to?('[]')
      @row = @placement.try(:[], 'row')
      @col = @placement.try(:[], 'col')
    end
    # now make room for these cards (unless we're at the end)
    return if @placement == 'end' || @to_collection.is_a?(Collection::Board)

    @to_collection.increment_card_orders_at(@order, amount: @cards.count)
  end

  def register_card_mappings
    run_worker_sync = %i[all_levels first_level].include?(@synchronous)

    # ensure parent_collection_card exists
    if @building_template_instance && @cards.size == 1 && @to_collection.parent_collection_card.present?
      # Append the template instance card,
      # so that the mapper will include the entire template in its mapping
      card_ids = @cards.map(&:id) + [@to_collection.parent_collection_card.id]
    else
      card_ids = @cards.map(&:id)
    end

    CardDuplicatorMapperFindLinkedCardsWorker.send(
      "perform_#{run_worker_sync ? 'sync' : 'async'}",
      @batch_id,
      card_ids,
      @for_user&.id,
      @system_collection,
    )
  end

  def deep_duplicate_cards
    run_worker_sync = %i[all_levels first_level].include?(@synchronous)
    # Use placeholders if we just created them, otherwise pass in original card ids
    card_ids = @synchronous == :async ? @new_cards.map(&:id) : @cards.map(&:id)

    # Note: the CardDuplicatorMapperFindLinkedCardsWorker needs
    #       to run before this duplication worker so that it
    #       can map all cards that need linking

    result = CollectionCardDuplicationWorker.send(
      "perform_#{run_worker_sync ? 'sync' : 'async'}",
      @batch_id,
      card_ids,
      @to_collection.id,
      @for_user&.id,
      @system_collection,
      @synchronous == :all_levels,
      @building_template_instance,
    )
    @new_cards = Array(result) if run_worker_sync
  end

  def duplicate_cards_with_placeholders
    pin_duplicating_cards = should_pin_duplicating_cards?

    @cards.each_with_index do |card, i|
      # Skip if legend item - they will be moved over in `CollectionCardDuplicationWorker#duplicate_legend_items`
      next if card.item&.is_a?(Item::LegendItem)
      # Skip SharedWithMe (not allowed)
      next if card.collection&.is_a?(Collection::SharedWithMeCollection)

      # copy attributes from original, including item/collection_id which will
      # help us refer back to the originals when duplicating
      dup = card.amoeba_dup.becomes(CollectionCard::Placeholder)
      dup.type = 'CollectionCard::Placeholder'
      dup.pinned ||= pin_duplicating_cards
      dup.parent_id = @to_collection.id
      unless moving_to_board?
        dup.order = @order + i
      end

      @new_cards << dup
    end

    if moving_to_board?
      # this will just calculate the correct row/col values onto @new_cards
      CollectionGrid::BoardPlacement.call(
        to_collection: @to_collection,
        from_collection: from_collection,
        moving_cards: @new_cards,
        row: @row,
        col: @col,
      )
    end

    CollectionCard.import(@new_cards)
    @to_collection.update_processing_status(:duplicating)
  end

  def reorder_and_cache_covers
    @to_collection.reorder_cards!
    @to_collection.cache_cover!
  end

  def moving_to_board?
    @to_collection.is_a? Collection::Board
  end

  def from_collection
    # this is just inferred from what you are moving, just to figure out if you
    # are moving cards from a normal Collection or not
    @cards.first.parent
  end

  def should_pin_duplicating_cards?
    return false unless @cards.first.present?

    @to_collection.should_pin_cards?(@placement)
  end
end
