class CollectionCardArchiveWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, user_id)
    @actor = User.find(user_id)
    collection_cards = CollectionCard.where(id: card_ids)
    collection_cards.each do |card|
      next if card.archived?
      card.archive!
      create_notification(card) if notify?(card)
    end
  end

  private

  def notify?(card)
    # Don't notify if link or item_attributes
    return false if card.link? || card.item_id.present?
    # Don't notify if collection is empty
    return false if card.collection_id.present? && card.collection.children.size.zero?
    true
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
