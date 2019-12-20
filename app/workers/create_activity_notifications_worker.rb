class CreateActivityNotificationsWorker
  include Sidekiq::Worker

  def perform(
    activity_id,
    omit_user_ids,
    omit_group_ids,
    combine
  )
    @activity = Activity.find(activity_id)
    NotificationBuilder.call(
      activity: @activity,
      omit_user_ids: omit_user_ids,
      omit_group_ids: omit_group_ids,
      combine: combine,
    )
  end
end
