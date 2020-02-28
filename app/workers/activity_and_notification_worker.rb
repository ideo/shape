class ActivityAndNotificationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(
    actor_id,
    target_id,
    target_class,
    source_id,
    source_class,
    action,
    content = nil
  )
    actor = User.find(actor_id)
    target = target_class.safe_constantize.find(target_id)
    source = nil
    if source_id && source_class
      source = source_class.safe_constantize.find(source_id)
    end

    ActivityAndNotificationBuilder.call(
      actor: actor,
      target: target,
      source: source,
      action: action,
      content: content,
      async: false,
    )
  end
end
