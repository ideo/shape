class ActivityAndNotificationBuilder
  attr_reader :errors, :activity

  def initialize(
    actor:,
    target:,
    action:,
    subject_users: [],
    subject_groups: []
  )
    @actor = actor
    @target = target
    @action = action
    @subject_users = subject_users
    @subject_groups = subject_groups
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
        user: user
      )
    end
  end
end
