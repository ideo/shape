class CollectionCardArchiveWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, user_id)
    @actor = User.find(user_id)
    collection_cards = CollectionCard.where(id: card_ids)
    collection_cards
      .includes(:item, :collection)
      .each do |card|
      next if card.finished_archiving?
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
    participants = get_target_participants(card.record)
    ActivityAndNotificationBuilder.call(
      actor: @actor,
      target: card.record,
      action: :archived,
      subject_user_ids: participants.map(&:actor_id),
      subject_group_ids: [],
    )
  end

  def get_target_participants(record)
    measures = {
      d_measure: 'participants',
      d_timeframe: 'ever',
      d_filters: [{ 'type': record.class.name, 'target': record.id }],
    }
    report DataReport::Internal.new(record, override_measures: measures, show_users: true).call
    report[:value]
  end
end
