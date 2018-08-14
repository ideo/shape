# for previewing emailer in browser
class NotificationMailerPreview < ActionMailer::Preview
  def notify
    u = User.first
    NotificationMailer.notify(
      user_id: u.id,
      notification_ids: u.notifications.last(10).map(&:id),
      comment_thread_ids: u.comment_threads.last(10).map(&:id),
    )
  end

  # alt method that utilizes our NotificationDigest service
  # this requires the user to actually have "new" things from the last 30 days
  def notify_via_service
    u = User.first
    u.update(last_notification_mail_sent: 30.days.ago)
    service = NotificationDigest.new(type: :notifications)
    service.notify_user(u, deliver: false)
  end
end
