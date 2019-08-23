class CollectionCardDuplicationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(opts)
    opts_hash = JSON.parse(opts)
    card_ids = opts_hash['card_ids']
    from_collection_id = opts_hash['from_collection_id']
    parent_collection_id = opts_hash['parent_collection_id']
    for_user_id = opts_hash['for_user_id'] || nil
    synchronous = opts_hash['synchronous'] || false
    duplicate_linked_records = opts_hash['duplicate_linked_records'] || false
    system_collection = opts_hash['system_collection'] || false

    @new_cards = []
    collection_cards = CollectionCard.active.where(id: card_ids).ordered
    # fixme: ActiveRecord::RecordNotFound: Couldn't find Collection without an ID
    # when duplicating collections with child collections
    @current_user = User.find(for_user_id) if for_user_id.present?
    @to_collection = Collection.find(parent_collection_id)
    @from_collection = Collection.find(from_collection_id)
    target_empty_row = @to_collection.empty_row_for_moving_cards
    @to_collection.update_processing_status(Collection.processing_statuses[:duplicating])
    should_update_cover = false
    collection_cards.each_with_index do |card, i|
      # Skip duplicating any cards this user can't view (if user provided)
      # If a system collection don't check if user can view
      next if @current_user.present? && !system_collection && !card.record.can_view?(@current_user)

      # duplicating each card in order, each subsequent one should be placed at the end
      # todo: test this
      dup = card.duplicate!(for_user: @current_user,
                      parent: @to_collection,
                      system_collection: system_collection,
                      synchronous: synchronous,
                      duplicate_linked_records: duplicate_linked_records)

      if @to_collection.is_a? Collection::Board
        dup.update(row: target_empty_row, col: i)
      end
      should_update_cover ||= dup.should_update_parent_collection_cover?
      @new_cards << dup
    end
    duplicate_legend_items
    @to_collection.reorder_cards!
    @to_collection.cache_cover! if should_update_cover
    @new_cards.each do |card|
      create_notification(card, :duplicated)
    end
    @to_collection.update_processing_status(nil)
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

  def create_notification(card, action)
    # Only notify for archiving of collections (and not link cards)
    return if card.link?

    ActivityAndNotificationBuilder.call(
      actor: @current_user,
      target: card.record,
      action: action,
      subject_user_ids: card.record.editors[:users].pluck(:id),
      subject_group_ids: card.record.editors[:groups].pluck(:id),
      source: @from_collection,
      destination: @to_collection,
    )
  end
end
