# this gets called asynchronously from ActivityAndNotificationBuilder -> Worker
class NotificationBuilder < SimpleService
  delegate(
    :actor,
    :target,
    :action,
    :organization,
    :content,
    :source,
    :destination,
    :subject_user_ids,
    :subject_group_ids,
    to: :@activity,
  )

  def initialize(
    activity:,
    omit_user_ids: [],
    omit_group_ids: [],
    combine: false
  )
    @activity = activity
    @omit_user_ids = omit_user_ids
    @omit_group_ids = omit_group_ids
    @combine = combine
    @created_notifications = []
  end

  def call
    create_notifications
  end

  private

  def create_notifications
    # NOTE: this comes from roles/shared_methods
    group_user_ids = Group.where(id: subject_group_ids).user_ids
    @omit_user_ids += Group.where(id: @omit_group_ids).user_ids
    all_user_ids = subject_user_ids + group_user_ids
    User
      .where(id: all_user_ids)
      .where.not(status: :archived)
      .find_each do |user|
      skippable = (
        # don't notify for user's own activities
        user.id == actor.id ||
        # if we've explicitly omitted them
        @omit_user_ids.include?(user.id) ||
        # or if they're unsubscribed
        !should_receive_notifications?(user)
      )
      next if skippable

      if @combine
        if (notif = combine_existing_notifications(user.id))
          @created_notifications << notif
          next
        end
      end
      notif = Notification.create(
        activity: @activity,
        user_id: user.id,
      )
      @created_notifications << notif if notif
    end
  end

  def find_similar_activities
    Activity
      .where(target: target,
             action: action)
  end

  def find_similar_notifications(user_id, similar_activities)
    Notification.where(
      activity_id: similar_activities.map(&:id),
      user: user_id,
      read: false,
    )
  end

  def combine_existing_notifications(user_id)
    # Find similar notifications based on target and action (multiple comments)
    # TODO: possible not to run these queries for each user?
    similar_activities = find_similar_activities
    similar_notifications = find_similar_notifications(user_id, similar_activities)
    return if similar_notifications.empty?

    activity_ids = []
    if similar_notifications.first.combined_activities_ids.count.positive?
      activity_ids = similar_notifications.first.combined_activities_ids
    elsif similar_notifications.count > 1
      activity_ids = similar_notifications.map(&:activity).map(&:id)
    end
    # Condense the existing 3 down to one notification
    created = Notification.create(
      activity: @activity,
      user_id: user_id,
      combined_activities_ids: (activity_ids + [@activity.id]),
    )
    similar_notifications.where.not(id: created.id).destroy_all
    created
  end

  def store_in_firestore
    return unless @created_notifications.present?

    FirestoreBatchWriter.perform_in(
      3.seconds,
      @created_notifications.compact.map(&:batch_job_identifier),
    )
  end

  def should_receive_notifications?(user)
    return true if target.is_a? Group

    parents_unsubscribed = target.any_parent_unsubscribed?(user)
    return !parents_unsubscribed if target.comment_thread.nil?

    users_thread = target.comment_thread.users_thread_for(user)
    return !parents_unsubscribed if users_thread.nil?

    users_thread.subscribed
  end
end
