class TextItemBroadcastWorker
  include Sidekiq::Worker

  def perform(item_id, user_id = nil)
    @item = Item.find_by(id: item_id)
    @user = User.find_by(id: user_id)

    broadcast
  end

  private

  def broadcast
    return if @item.nil? || @item.parent.nil?

    @item.update_columns(last_broadcast_at: Time.current)
    parent = @item.parent
    if parent&.num_viewers&.positive?
      CollectionUpdateBroadcaster.new(parent, @user).text_item_updated(@item)
    end

    return if @item.cards_linked_to_this_item.none?

    # since we're already in a worker can perform this one sync
    LinkBroadcastWorker.perform_sync(
      @item.id,
      'Item',
      @user&.id,
    )
  end
end
