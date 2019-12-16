class CollectionCardDuplicationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(
    card_ids,
    parent_collection_id,
    for_user_id = nil,
    system_collection = false,
    synchronous = false,
    batch_id = nil
  )
    @collection_cards = CollectionCard.active.where(id: card_ids).ordered
    @for_user = User.find(for_user_id) if for_user_id.present?
    @parent_collection = Collection.find(parent_collection_id)
    @system_collection = system_collection
    @synchronous = synchronous
    @system_collection = system_collection
    @from_collection = nil
    @batch_id = batch_id

    duplicate_cards
    update_parent_collection_status
  end

  def duplicate_cards
    @parent_collection.update_processing_status(:duplicating)
    @collection_cards.each do |card|
      # Skip duplicating any cards this user can't view (if user provided)
      # If a system collection don't check if user can view
      next if @for_user.present? && !@system_collection && !card.record.can_view?(@for_user)

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
      duplicate_card = source_card.duplicate!(
        for_user: @for_user,
        parent: @parent_collection,
        placement: placement,
        system_collection: @system_collection,
        synchronous: @synchronous,
        placeholder: placeholder,
      )
      CardDuplicatorMapper::Base.new(
        batch_id: @batch_id,
      ).map_duplication(
        from_card_id: source_card.id,
        to_card_id: duplicate_card.id,
      )
    end
  end

  def update_parent_collection_status
    @parent_collection.update_processing_status(nil)
    CollectionUpdateBroadcaster.call(@parent_collection)
  end

  def create_notifications
    @collection_cards.each do |card|
      ActivityAndNotificationBuilder.call(
        actor: @for_user,
        target: card.record,
        action: :duplicate,
        subject_user_ids: card.record.editors[:users].pluck(:id),
        subject_group_ids: card.record.editors[:groups].pluck(:id),
        source: @from_collection,
        destination: @to_collection,
      )
    end
  end
end
