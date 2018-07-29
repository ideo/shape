require 'sidekiq-scheduler'

class NotificationMailerWorker
  include Sidekiq::Worker

  def perform
    puts 'Sending notification emails'
    User.all.each do |user|
      notifications = notifications_for_user(user)
      comment_threads = comment_threads_for_user(user)
      next if notifications.count == 0 && comment_threads.count == 0
      NotficationMailer.notify(
        user_id: user.id,
        notification_ids: notifications.map(&:id),
        comment_thread_ids: comment_threads.map(&:id),
      )
      user.last_notification_mail_sent = Time.now
      user.save
    end
  end

  def comment_threads_for_user(user)
    user.users_threads.where(
      UsersThread.arel_table[:last_viewed_at].lt(
        user.last_notification_mail_sent
      )
    ).map(&:comment_thread)
  end

  def notifications_for_user(user)
    user.notifications.where(
      read: false,
      Notification.arel_table[:created_at].lt(user.last_notification_mail_sent)
    )
  end
end
