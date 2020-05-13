class CollectionCardDuplicationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(
    batch_id,
    card_ids,
    parent_collection_id,
    for_user_id = nil,
    system_collection = false,
    synchronous = false,
    building_template_instance = false
  )
    @batch_id = batch_id
    @duplicating_cards = CollectionCard.active.where(id: card_ids).ordered
    @for_user = User.find(for_user_id) if for_user_id.present?
    @parent_collection = Collection.find(parent_collection_id)
    @system_collection = system_collection
    @synchronous = synchronous
    @system_collection = system_collection
    @building_template_instance = building_template_instance
    @new_cards = duplicate_cards
    return false if infinite_loop_detected?

    duplicate_legend_items
    update_parent_cover
    update_parent_collection_status
    @new_cards
  end

  def duplicate_cards
    @parent_collection.update(processing_status: :duplicating)

    cards_to_duplicate.map do |card|
      # duplicating each card in order, each subsequent one should be placed at the end
      placement = 'end'
      source_card = card
      placeholder = nil
      if card.is_a?(CollectionCard::Placeholder)
        # placeholder has a reference to the record, we want to copy *its* parent card
        source_card = card.record.parent_collection_card
        # we already know the order (and card.pinned will also be set)
        placement = card.order
        placeholder = card
      else
        source_card.pinned = false unless preserve_pinned_value?
      end

      # TODO: Do we want to keep this guard?
      next unless source_card

      source_card.duplicate!(
        for_user: @for_user,
        parent: @parent_collection,
        placement: placement,
        system_collection: @system_collection,
        synchronous: @synchronous,
        placeholder: placeholder,
        batch_id: @batch_id,
        building_template_instance: @building_template_instance,
      )
    end
  end

  private

  def infinite_loop_detected?
    return unless @parent_collection.cloned_from_id.present?

    errors = @parent_collection.detect_infinite_loop
    return unless errors.present?

    error_msg = "CollectionCardDuplicationWorker: #{errors.join(',')}"
    logger.warn error_msg unless Rails.env.test?
    Appsignal.set_error(
      StandardError.new(error_msg),
      parent_collection_id: @parent_collection.id,
    )
    true
  end

  def cards_to_duplicate
    @duplicating_cards.select do |card|
      # Skip duplicating any cards this user can't view (if user provided)
      # If a system collection don't check if user can view
      if @building_template_instance || @system_collection
        true
      elsif @for_user.present? && !card.record.can_view?(@for_user)
        false
      else
        true
      end
    end
  end

  def update_parent_collection_status
    @parent_collection.update(processing_status: nil)
    # @for_user is omitted so the user can reload their placeholder cards into the new ones
    CollectionUpdateBroadcaster.new(@parent_collection).cards_updated(
      @new_cards.pluck(:id),
    )
  end

  def update_parent_cover
    cover_card_ids = @parent_collection.cached_cover.try(:[], 'card_ids')
    return unless cover_card_ids.present?

    cover_cards = @parent_collection.collection_cards.where(id: cover_card_ids)
    # continue if these marked cover_cards don't exist in the new collection
    return unless cover_cards.none?

    # at this point we know the copied cover ids are referencing old ones, so we re-cache
    @parent_collection.cache_cover!
  end

  def duplicate_legend_items
    mover = LegendMover.new(
      to_collection: @parent_collection,
      cards: (@parent_collection.collection_cards + @new_cards).compact.uniq,
      action: 'duplicate',
    )
    return unless mover.call

    @new_cards += mover.legend_item_cards
  end

  def preserve_pinned_value?
    @building_template_instance || @parent_collection.master_template?
  end
end
