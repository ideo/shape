class CollectionCardsAddRemoveTag
  include Sidekiq::Worker

  # Possible actions are add and remove

  def perform(collection_card_ids, tag, action)
    collection_cards = CollectionCard.where(id: collection_card_ids)
    action = action.to_sym

    return unless %i[add remove].include?(action)

    ActiveRecord::Base.transaction do
      collection_cards.each do |card|
        record = card.record
        record.tag_list.send(action, tag)
        # Collection needs to be called manually to set cached attributes
        record.update_cached_tag_lists if record.is_a?(Collection)
        record.save
      end
    end

    # Touch parent collection to bust cache
    collection_cards.first.parent.touch
  end
end
