class CollectionCardsAddRemoveTagWorker
  include Sidekiq::Worker

  # Possible actions are add and remove

  def perform(collection_card_ids, tag, type, action, user_id)
    return unless %i[add remove].include?(action.to_sym)
    return unless %i[tag_list topic_list user_tag_list].include?(type.to_sym)

    collection_cards = CollectionCard.where(id: collection_card_ids)

    ActiveRecord::Base.transaction do
      collection_cards.each do |card|
        record = card.record
        record.send(type).send(action, tag)
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
