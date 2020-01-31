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
    @collection_cards = CollectionCard.active.where(id: card_ids).ordered
    @for_user = User.find(for_user_id) if for_user_id.present?
    @parent_collection = Collection.find(parent_collection_id)
    @system_collection = system_collection
    @synchronous = synchronous
    @system_collection = system_collection
    @from_collection = nil
    @building_template_instance = building_template_instance
    @new_cards = duplicate_cards
    duplicate_legend_items
    update_parent_collection_status
    @new_cards
  end

  def duplicate_cards
    @parent_collection.update_processing_status(:duplicating)

    # determine if all moving cards should be pinned/unpinned based on the card to the left of the first moving card
    pin_duplicating_card = should_pin_duplicating_cards?

    cards_to_duplicate.map do |card|
      # duplicating each card in order, each subsequent one should be placed at the end
      placement = 'end'
      source_card = card
      placeholder = nil
      if card.is_a?(CollectionCard::Placeholder)
        # placeholder has a reference to the record, we want to copy *its* parent card
        source_card = card.record.parent_collection_card
        # we already know the order
        placement = card.order
        placeholder = card
      end
      # capture this for notification builder
      @from_collection ||= source_card.parent

      source_card.duplicate!(
        for_user: @for_user,
        parent: @parent_collection,
        placement: placement,
        system_collection: @system_collection,
        synchronous: @synchronous,
        placeholder: placeholder,
        batch_id: @batch_id,
        building_template_instance: @building_template_instance,
        should_pin_duplicating_cards: source_card.pinned? || pin_duplicating_card,
      )
    end
  end

  def cards_to_duplicate
    @collection_cards.select do |card|
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
    @parent_collection.update_processing_status(nil)
    CollectionUpdateBroadcaster.call(@parent_collection)
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

  private

  def should_pin_duplicating_cards?
    return false unless @collection_cards.first.present?

    @parent_collection.should_pin_cards?(@collection_cards.first.order)
  end
end
