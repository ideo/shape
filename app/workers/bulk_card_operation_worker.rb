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
    @order = @placeholder.order
    @for_user = for_user_id ? User.find(for_user_id) : nil

    @placeholder.destroy

    perform_action
    broadcast
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
    {
      to_collection: @to_collection,
      cards: @cards,
      placement: @order,
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
