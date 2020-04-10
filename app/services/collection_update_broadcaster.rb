class CollectionUpdateBroadcaster < SimpleService
  def initialize(collection, user = nil)
    @collection = collection
    @user = user
  end

  def call
    return if @collection.nil?

    # single_edit method comes from RealtimeEditorsViewers concern
    @collection.single_edit(@user)
  end

  def cards_archived(card_ids)
    broadcast(archived_card_ids: card_ids.map(&:to_s))
  end

  def row_updated(params)
    broadcast(row_updated: params)
  end

  def cards_updated(collection_cards_attributes)
    broadcast(collection_cards_attributes: collection_cards_attributes)
  end

  def card_updated(card_id)
    broadcast(card_id: card_id.to_s)
  end

  # NOTE: this method is not currently used as we investigate whether the frequency of updates
  # was causing some of the collaborative issues.
  # Resurrect `CollectionPage.js#handleTextItemUpdate` from this commit if you wish to restore.
  def text_item_updated(item)
    return if @collection.nil?

    @collection.received_changes(
      {
        item: {
          id: item.id,
          quill_data: item.quill_data,
        },
      },
      @user,
    )
  end

  private

  def broadcast(data)
    @collection.received_changes(data, @user)
  end
end
