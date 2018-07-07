class ActivityAndNotificationBuilder < SimpleService
  attr_reader :errors, :activity

  def initialize(
    actor:,
    target:,
    action:,
    subject_user_ids: [],
    subject_group_ids: [],
    combine: false,
    content: nil
  )
    @actor = actor
    @target = target
    @action = action
    # "subjects" can also refer to the people meant to be notified,
    # e.g. in the case of "archive" it will be all the admins of that record
    @subject_user_ids = subject_user_ids
    @subject_group_ids = subject_group_ids
    @combine = combine
    @content = content
    @errors = []
    @activity = nil
    @created_notifications = []
  end

  def call
    create_activity
    if @activity
      create_notifications
      store_in_firestore
    end
  end

  private

  def create_activity
    @activity = Activity.create(
      actor: @actor,
      subject_user_ids: @subject_user_ids,
      subject_group_ids: @subject_group_ids,
      target: @target,
      action: @action,
      organization: @actor.current_organization,
      content: @content,
    )
  end

  def create_notifications
    # NOTE: this comes from roles/shared_methods
    group_user_ids = Group.where(id: @subject_group_ids).user_ids
    all_user_ids = @subject_user_ids + group_user_ids
    all_user_ids.uniq.each do |user_id|
      next if user_id == @actor.id
      if @combine
        if (notif = combine_existing_notifications(user_id))
          @created_notifications << notif
          next
        end
      end
      notif = Notification.create(
        activity: @activity,
        user_id: user_id,
      )
      @created_notifications << notif if notif
    end
  end

  def find_similar_activities
    Activity
      .where(target: @target,
             action: @action)
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
    FirestoreBatchWriter.perform_async(
      @created_notifications.compact.map(&:batch_job_identifier),
    )
  end
end
