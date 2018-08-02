class NotificationMailer < ApplicationMailer
  add_template_helper ApplicationHelper

  def notify(user_id:, notification_ids:, comment_thread_ids:)
    @user = User.find(user_id)
    @notifications = Notification.where(id: notification_ids)
    @comment_threads = CommentThread.where(id: comment_thread_ids)

    mail to: @user.email,
         subject: "#{@notifications.count} new notifications on Shape"
  end
end
