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

  def collection_updated
    broadcast(collection_updated: true)
  end

  def reload_cards
    broadcast(reload_cards: true)
  end

  def card_updated(card_id)
    broadcast(card_id: card_id.to_s)
  end

  def text_item_updated(item)
    broadcast(
      text_item: {
        id: item.id,
        quill_data: item.quill_data,
        parent_collection_card_id: item.parent_collection_card&.id,
      },
    )
  end

  private

  def broadcast(data)
    return if @collection.nil?

    @collection.received_changes(data, @user)
  end
end
