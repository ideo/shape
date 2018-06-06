class ActivityAndNotificationBuilder
  attr_reader :errors, :activity

  def initialize(
    actor:,
    target:,
    action:,
    subject_users: [],
    subject_groups: [],
    combine: false,
    content: nil
  )
    @actor = actor
    @target = target
    @action = action
    @subject_users = subject_users
    @subject_groups = subject_groups
    @combine = combine
    @content = content
    @errors = []
    @activity = nil
  end

  def call
    create_activity
    create_notifications if @activity
  end

  private

  def create_activity
    @activity = Activity.create(
      actor: @actor,
      subject_users: @subject_users,
      subject_groups: @subject_groups,
      target: @target,
      action: @action,
      organization: @actor.current_organization,
      content: @content,
    )
  end

  def create_notifications
    # TODO: just pass all user_ids to this service rather than computing them here?
    # NOTE: this comes from roles/shared_methods
    unless (group_user_ids = @subject_groups.try(:user_ids))
      group_user_ids = Group.where(id: @subject_groups.pluck(:id)).user_ids
    end
    all_users = @subject_users + User.where(id: group_user_ids)
    all_users.uniq.each do |user|
      next if user == @actor
      if @combine
        combined = combine_existing_notifications(user)
        next if combined
      end
      Notification.create(
        activity: @activity,
        user: user,
      )
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
    # Find similar notifications based on target and action (multiple comments)
    # TODO: possible not to run these queries for each user?
    similar_activities = find_similar_activities
    similar_notifications = find_similar_notifications(user, similar_activities)
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
      user: user,
      combined_activities_ids: (activity_ids + [@activity.id]),
    )
    similar_notifications.where.not(id: created.id).destroy_all
    created
  end
end
