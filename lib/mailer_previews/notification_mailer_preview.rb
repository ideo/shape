# for previewing emailer in browser
class NotificationMailerPreview < ActionMailer::Preview
  def notify
    u = User.first
    NotificationMailer.notify(
      user_id: u.id,
      notification_ids: u.notifications.first(10).map(&:id),
      comment_thread_ids: u.comment_threads.first(10).map(&:id),
    )
  end
end
