class NotificationDigest < SimpleService
  # type can be :notifications or :mentions
  def initialize(type:, timeframe: 6.hours.ago)
    unless %i[notifications mentions].include? type
      raise StandardError, 'Unsupported notification digest type'
    end
    @type = type
    @timeframe = timeframe
  end

  def call
    collect_users
    notify_users
  end

  # public method used in notification_mailer_preview
  def notify_user(user, deliver: true)
    if user.last_notification_mail_sent.nil?
      user.update(last_notification_mail_sent: 1.day.ago)
    end
    notification_ids = notifications_for_user(user)
    comment_thread_ids = comment_threads_for_user(user)
    return if notification_ids.count.zero? && comment_thread_ids.count.zero?
    mailer = NotificationMailer.notify(
      user_id: user.id,
      last_notification_mail_sent: user.last_notification_mail_sent,
      notification_ids: notification_ids,
      comment_thread_ids: comment_thread_ids,
    )
    mailer.deliver_later if deliver
    user.update(last_notification_mail_sent: Time.now)
    mailer
  end

  private

  def collect_users
    if @type == :notifications
      @users = users_with_recent_notifications
    elsif @type == :mentions
      @users = users_with_recent_mentions
    end
    # omit people who have opted out of emails
    @users = @users.where(notify_through_email: true)
  end

  def users_with_recent_notifications
    user_joins = User.left_joins(:notifications, users_threads: :comment_thread)
    user_joins
      .where(CommentThread.arel_table[:updated_at].gt(@timeframe))
      .or(
        user_joins.where(
          Notification.arel_table[:created_at].gt(@timeframe),
        ),
      )
      .distinct
  end

  def users_with_recent_mentions
    # Find all recent comments, collect user mentions
    mentioned_user_ids = []
    Comment.where(
      Comment.arel_table[:created_at].gt(@timeframe),
    ).each do |c|
      # use array union to gather unique user_ids
      mentioned_user_ids |= c.mentions[:user_ids]
    end
    User.where(id: mentioned_user_ids)
  end

  def notify_users
    @users.find_each do |user|
      notify_user(user)
    end
  end

  def comment_threads_for_user(user)
    # gather comment threads with new activity since the last notification mail
    user.users_threads
        .joins(:comment_thread)
        .where(
          CommentThread.arel_table[:updated_at].gt(
            UsersThread.arel_table[:last_viewed_at],
          ),
        )
        .where(
          CommentThread.arel_table[:updated_at].gt(
            user.last_notification_mail_sent,
          ),
        )
        .pluck(:comment_thread_id)
  end

  def notifications_for_user(user)
    user.notifications
        .where(read: [false, nil])
        .where(
          Notification.arel_table[:created_at].gt(
            user.last_notification_mail_sent,
          ),
        )
        .pluck(:id)
  end
end
