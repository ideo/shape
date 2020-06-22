class CollectionCardsAddRemoveTagWorker
  include Sidekiq::Worker

  # Possible actions are add and remove

  def perform(collection_card_ids, tag, type, action, user_id)
    collection_cards = CollectionCard.where(id: collection_card_ids)
    action = action.to_sym

    return unless %i[add remove].include?(action)

    ActiveRecord::Base.transaction do
      collection_cards.each do |card|
        record = card.record
        case type
        when 'user_tag_list'
          record.people_list.send(action, tag)
        when 'tag_list'
          record.tag_list.send(action, tag)
        end
        # Collection needs to be called manually to set cached attributes
        record.update_cached_tag_lists if record.is_a?(Collection)
        record.save
      end
    end

    # Touch parent collection to bust cache
    parent_collection = collection_cards.first.parent
    parent_collection.touch
    # Notify other people collection has updated
    CollectionUpdateBroadcaster.call(parent_collection, User.find(user_id))
  end
end
