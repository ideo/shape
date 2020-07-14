class BulkCardOperationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, action, placeholder_id, for_user_id)
    @cards = CollectionCard.where(id: card_ids)
    return unless @cards.present?

    @action = action
    # what if the placeholder was destroyed in a failed job?
    @placeholder = CollectionCard.find(placeholder_id)
    @to_collection = @placeholder.parent
    @for_user = for_user_id ? User.find(for_user_id) : nil

    ActiveRecord::Base.transaction do
      @placeholder.destroy
      success = perform_action
      raise ActiveRecord::Rollback unless success

      broadcast
    end
  end

  private

  def perform_action
    if @action == 'duplicate'
      CollectionCardDuplicator.call(duplicate_params)
    elsif %w[move link].include?(@action)
      CardMover.call(move_params)
    end
  end

  def common_params
    if @to_collection.board_collection?
      placement = { 'row' => @placeholder.row, 'col' => @placeholder.col }
    else
      placement = @placeholder.order
    end
    {
      to_collection: @to_collection,
      cards: @cards,
      placement: placement,
    }
  end

  def duplicate_params
    common_params.merge(
      for_user: @for_user,
    )
  end

  def move_params
    common_params.merge(
      from_collection: @cards.first.parent,
      card_action: @action,
    )
  end

  def broadcast
    CollectionUpdateBroadcaster.call(@to_collection)
  end
end
