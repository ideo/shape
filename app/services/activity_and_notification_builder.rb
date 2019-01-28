class ActivityAndNotificationBuilder < SimpleService
  attr_reader :errors, :activity

  def initialize(
    actor:,
    target:,
    action:,
    subject_user_ids: [],
    subject_group_ids: [],
    omit_user_ids: [],
    omit_group_ids: [],
    combine: false,
    content: nil,
    source: nil,
    destination: nil,
    organization: nil
  )
    @actor = actor
    @target = target
    @action = action
    # "subjects" can also refer to the people meant to be notified,
    # e.g. in the case of "archive" it will be all the admins of that record
    @subject_user_ids = subject_user_ids
    @subject_group_ids = subject_group_ids
    @omit_user_ids = omit_user_ids
    @omit_group_ids = omit_group_ids
    @combine = combine
    @content = content
    @source = source
    @destination = destination
    @organization = organization || actor.current_organization
    @errors = []
    @activity = nil
    @created_notifications = []
  end

  def call
    create_activity
    return unless @activity&.should_notify?
    create_notifications
    store_in_firestore
  end

  private

  def create_activity
    @activity = Activity.new(
      actor: @actor,
      target: @target,
      action: @action,
      organization: @organization,
      content: @content,
      source: @source,
      destination: @destination,
    )
    unless @activity.no_subjects?
      @activity.subject_user_ids = @subject_user_ids
      @activity.subject_group_ids = @subject_group_ids
    end
    @activity.save
  end

  def create_notifications
    # NOTE: this comes from roles/shared_methods
    group_user_ids = Group.where(id: @subject_group_ids).user_ids
    @omit_user_ids += Group.where(id: @omit_group_ids).user_ids
    all_user_ids = @subject_user_ids + group_user_ids
    User
      .where(id: all_user_ids)
      .where.not(status: :archived)
      .find_each do |user|
      next if user.id == @actor.id
      next if @omit_user_ids.include? user.id
      next unless should_receive_notifications?(user) && @action != :mentioned
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
    FirestoreBatchWriter.perform_in(
      3.seconds,
      @created_notifications.compact.map(&:batch_job_identifier),
    )
  end

  def should_record_receive_notifications(record, user)
    return true if record.comment_thread.nil?
    users_thread = record.comment_thread.users_thread_for(user)
    return true if users_thread.nil?
    users_thread.subscribed
  end

  def should_receive_notifications?(user)
    return true if @target.is_a? Group
    return false if @target.comment_thread.nil?
    users_thread = @target.comment_thread.users_thread_for(user)
    return false if users_thread.nil?
    return false unless users_thread.subscribed

    should_receive = true
    @target.parents.each do |r|
      should_receive = should_record_receive_notifications(r, user)
      break unless should_receive
    end
    should_receive
  end
end
