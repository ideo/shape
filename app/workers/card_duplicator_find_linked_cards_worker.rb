class CollectionCardDuplicatorFindLinkedCardsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, batch_id)
    CardDuplicatorMapper::FindLinkedCards.call(
      card_ids: card_ids,
      batch_id: batch_id,
    )
  end
end
