class CollectionUpdateBroadcaster < SimpleService
  def initialize(collection, user = nil)
    @collection = collection
    @user = user
  end

  def call
    # this just aliases to reload_cards since .call is still used in some places
    reload_cards
  end

  def cards_archived(card_ids)
    broadcast(archived_card_ids: card_ids.map(&:to_s))
  end

  def row_updated(params)
    broadcast(row_updated: params)
  end

  def card_attrs_updated(collection_cards_attributes)
    broadcast(collection_cards_attributes: collection_cards_attributes)
  end

  def collection_updated
    broadcast(collection_updated: true)
  end

  def card_updated(card)
    broadcast(card_id: card.id.to_s)
  end

  def cards_updated(card_ids)
    broadcast(card_ids: card_ids.map(&:to_s))
  end

  def text_item_updated(item)
    broadcast(
      text_item: {
        id: item.id.to_s,
        quill_data: item.quill_data,
        parent_collection_card_id: item.parent_collection_card&.id&.to_s,
      },
    )
  end

  # kind of the last resort ping to tell clients to refetch cards
  def reload_cards
    broadcast(reload_cards: true)
  end

  private

  def broadcast(data)
    return if @collection.nil?

    @collection.received_changes(data, @user)
  end
end
