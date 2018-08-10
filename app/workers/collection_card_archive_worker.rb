class CollectionCardArchiveWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, user_id)
    @actor = User.find(user_id)
    collection_cards = CollectionCard.where(id: card_ids)
    collection_cards.each do |card|
      next if card.archived?
      card.archive!
      create_notification(card)
    end
  end

  def create_notification(card)
    return if card.link?
    ActivityAndNotificationBuilder.call(
      actor: @actor,
      target: card.record,
      action: :archived,
      subject_user_ids: card.record.editors[:users].pluck(:id),
      subject_group_ids: card.record.editors[:groups].pluck(:id),
    )
  end
end
