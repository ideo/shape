class CollectionCardDuplicator < SimpleService
  def initialize(
    to_collection:,
    cards:,
    placement: nil,
    for_user: nil,
    system_collection: false,
    batch_id: nil,
    synchronous: :async,
    create_placeholders: true,
    building_template_instance: false
  )
    @to_collection = to_collection
    @cards = cards
    @placement = placement
    @for_user = for_user
    @system_collection = system_collection
    @batch_id = batch_id || "duplicate-#{SecureRandom.hex(10)}"
    @new_cards = []
    @should_update_cover = false
    @synchronous = validate_synchronous_value(synchronous)
    @building_template_instance = building_template_instance
    # NOTE: building_template_instance always sets create_placeholders = false
    @create_placeholders = create_placeholders && !building_template_instance
  end

  def call
    filter_out_invalid_cards
    initialize_card_order
    if @create_placeholders
      duplicate_cards_with_placeholders
    end
    register_card_mappings
    # FIXME: Don't try to duplicate cards that haven't been registered
    deep_duplicate_cards
    create_notifications
    return @new_cards unless run_worker_sync?

    # If synchronous, re-assign @new_cards to actual cards, overriding placeholders
    CollectionCard.where(id: @new_cards.map(&:id))
  end

  private

  def filter_out_invalid_cards
    @cards = @cards.reject do |card|
      card.record.is_a?(Collection::Global) || card.record.parent_collection_card.blank?
    end
  end

  def validate_synchronous_value(value)
    if value == true
      value = :all_levels
    elsif value == false
      value = :async
    end

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
    card_ids = @cards.map(&:id)
    # ensure parent_collection_card exists
    if @building_template_instance && @cards.size == 1 && @to_collection.parent_collection_card.present?
      # Append the template instance card,
      # so that the mapper will include the entire template in its mapping
      card_ids += [@to_collection.parent_collection_card.id]
    end

    CardDuplicatorMapperFindLinkedCardsWorker.send(
      "perform_#{run_worker_sync? ? 'sync' : 'async'}",
      @batch_id,
      card_ids,
      @for_user&.id,
      @system_collection,
    )
  end

  def deep_duplicate_cards
    # NOTE: the CardDuplicatorMapperFindLinkedCardsWorker needs
    #       to run before this duplication worker so that it
    #       can map all cards that need linking
    if @create_placeholders
      card_ids = @new_cards.pluck(:id)
    else
      card_ids = @cards.pluck(:id)
    end
    result = CollectionCardDuplicationWorker.send(
      "perform_#{run_worker_sync? ? 'sync' : 'async'}",
      @batch_id,
      card_ids,
      @to_collection.id,
      @for_user&.id,
      @system_collection,
      @synchronous == :all_levels,
      @building_template_instance,
    )
    return unless result && run_worker_sync?

    # when running sync, @new_cards is the result of the sync worker
    @new_cards = result
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
      if @to_collection.master_template?
        # only override the source card pinned value if pin_duplicating_cards is true or false
        dup.pinned = pin_duplicating_cards unless pin_duplicating_cards.nil?
      else
        dup.pinned = false
      end
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
    @to_collection.update(processing_status: :duplicating)
  end

  def create_notifications
    # only notify when a user initiates this action
    return if system_initiated?

    @cards.each do |card|
      ActivityAndNotificationForCardWorker.perform_async(
        @for_user&.id,
        card.id,
        :duplicated,
        from_collection.id,
        @to_collection.id,
      )
    end
  end

  # helpers

  def run_worker_sync?
    %i[all_levels first_level].include?(@synchronous)
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
    # in the event of moving into an empty collection (e.g. new template) retain the pinned value of the source card
    return nil if @to_collection.collection_cards.empty?
    return false unless @cards.first.present?

    # NOTE: this will always treat an empty to_collection as "unpinned", which may incorrectly unpin cards
    @to_collection.should_pin_cards?(@placement)
  end

  def system_initiated?
    @for_user.blank? || !@create_placeholders || @building_template_instance || @system_collection
  end
end
