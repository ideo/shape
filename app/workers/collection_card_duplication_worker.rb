class CollectionCardDuplicationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, for_user_id, parent_collection_id)
    collection_cards = CollectionCard.active.where(id: card_ids).ordered
    for_user = User.find(for_user_id)
    parent_collection = Collection.find(parent_collection_id)
    parent_collection.update_attribute(:processing, true)
    collection_cards.each do |card|
      next unless card.record.can_view?(for_user)
      # duplicating each card in order, each subsequent one should be placed at the end
      card.duplicate!(for_user: for_user, parent: parent_collection, placement: 'end')
    end
    parent_collection.update_attribute(:processing, false)
    parent_collection.processing_done
  end
end
