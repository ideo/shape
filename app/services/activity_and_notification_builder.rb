class ActivityAndNotificationBuilder
  attr_reader :errors, :activity

  def initialize(
    actor:,
    target:,
    action:,
    subject_users: [],
    subject_groups: [],
    combine: false
  )
    @actor = actor
    @target = target
    @action = action
    @subject_users = subject_users
    @subject_groups = subject_groups
    @combine = combine
    @errors = []
    @activity = nil
  end

  def call
    @activity = create_activity
    create_notifications(@activity)
  end

  private

  def create_activity
    Activity.create(
      actor: @actor,
      subject_users: @subject_users,
      subject_groups: @subject_groups,
      target: @target,
      action: @action,
      organization: @actor.current_organization,
    )
  end

  def create_notifications(activity)
    # TODO: this comes from roles/shared_methods
    unless (group_user_ids = @subject_groups.try(:user_ids))
      group_user_ids = Group.where(id: @subject_groups.pluck(:id)).user_ids
    end
    all_users = @subject_users + User.where(id: group_user_ids)
    all_users.uniq.each do |user|
      Notification.create(
        activity: activity,
        user: user,
      )
      combine_existing_notifications(user) if @combine
    end
  end

  def find_similar_activities
    Activity
      .where(target: @target,
             action: @action)
  end

  def find_similar_notifications(user, similar_activities)
    Notification.where(
      activity_id: similar_activities.map(&:id),
      user: user,
      read: false,
    )
  end

  def combine_existing_notifications(user)
    # Find similar notifications based on target and action (multiple comments) TODO: don't run this for each user
    similar_activities = find_similar_activities
    similar_notifications = find_similar_notifications(user, similar_activities)
    if similar_notifications.count > 2
      activity_ids = similar_notifications.map(&:activity).map(&:id)
    elsif similar_notifications.first.combined_activities_ids.count > 0
      activity_ids = similar_notifications.first.combined_activities_ids
    else
      return
    end
    # Condense the existing 3 down to one notification
    # TODO:
    Notification.create(
      activity: activity,
      user: user,
      combined_activities_ids: activity_ids,
    )
    similar_notifications.destroy_all
  end
end
