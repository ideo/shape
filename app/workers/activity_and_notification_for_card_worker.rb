class ActivityAndNotificationForCardWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(
    actor_id,
    card_id,
    action,
    from_collection_id,
    to_collection_id
  )
    actor = User.find(actor_id)
    card = CollectionCard.find(card_id)
    from_collection = nil
    to_collection = nil
    if from_collection_id
      from_collection = Collection.find(from_collection_id)
    end
    if to_collection_id
      to_collection = Collection.find(to_collection_id)
    end
    record = card.record
    return if record.nil?

    editors = record.editors
    ActivityAndNotificationBuilder.call(
      actor: actor,
      target: record,
      action: action,
      subject_user_ids: editors[:users].pluck(:id),
      subject_group_ids: editors[:groups].pluck(:id),
      source: from_collection,
      destination: to_collection,
    )
  end
end
