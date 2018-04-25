class CollectionCardDuplicationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, for_user_id, parent_collection_id)
    collection_cards = CollectionCard.where(id: card_ids)
    for_user = User.find(for_user_id)
    parent_collection = Collection.find(parent_collection_id)
    collection_cards.each do |card|
      next unless card.record.can_view?(for_user)
      card.duplicate!(for_user: for_user, parent: parent_collection)
    end
  end
end
