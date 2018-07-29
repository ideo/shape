# for previewing emailer in browser
class NotificationMailerPreview < ActionMailer::Preview
  def notify
    u = User.first
    NotificationMailer.notify(
      user_id: u.id,
      notification_ids: u.notifications.map(&:id),
      comment_thread_ids: u.comment_threads.map(&:id)
    )
  end
end
