class CollectionCardDuplicationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, parent_collection_id, for_user_id = nil, system_collection = false)
    collection_cards = CollectionCard.active.where(id: card_ids).ordered
    for_user = User.find(for_user_id) if for_user_id.present?
    parent_collection = Collection.find(parent_collection_id)
    parent_collection.update_processing_status(Collection.processing_statuses[:duplicating])
    collection_cards.each do |card|
      # Skip duplicating any cards this user can't view (if user provided)
      next if for_user.present? && !card.record.can_view?(for_user)
      # duplicating each card in order, each subsequent one should be placed at the end
      card.duplicate!(for_user: for_user,
                      parent: parent_collection,
                      placement: 'end',
                      system_collection: system_collection)
    end
    parent_collection.update_processing_status(nil)
  end
end
