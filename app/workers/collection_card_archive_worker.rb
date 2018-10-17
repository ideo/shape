class CollectionCardArchiveWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, user_id)
    @actor = User.find(user_id)
    collection_cards = CollectionCard.where(id: card_ids)
    collection_cards
      .includes(:item, :collection)
      .each do |card|
      next if card.archived?
      # Check if we should notify before archiving,
      # because afterwards the collection's cards will be archived
      notify = notify?(card)
      card.archive!
      create_notification(card) if notify
    end
  end

  private

  def notify?(card)
    # Only notify if it is a primary card of a collection that has cards
    return true if card.primary? &&
                   card.collection.present? &&
                   card.collection.cached_card_count &&
                   card.collection.cached_card_count.positive?
    false
  end

  def create_notification(card)
    ActivityAndNotificationBuilder.call(
      actor: @actor,
      target: card.record,
      action: :archived,
      subject_user_ids: card.record.editors[:users].pluck(:id),
      subject_group_ids: card.record.editors[:groups].pluck(:id),
    )
  end
end
