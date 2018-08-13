class NotificationMailer < ApplicationMailer
  add_template_helper ApplicationHelper

  def notify(user_id:, notification_ids:, comment_thread_ids:)
    @user = User.find(user_id)
    # preserve this value because we're about to update it
    @last_notification_mail_sent = @user.last_notification_mail_sent
    @user.update(last_notification_mail_sent: Time.now)
    @notifications = Notification
                     .where(id: notification_ids)
                     .order(created_at: :desc)
                     .first(10)
    @comment_threads = CommentThread
                       .where(id: comment_thread_ids)
                       .order(updated_at: :desc)
                       .first(5)

    subject = ''
    comment_count = 0
    @comment_threads.map do |ct|
      comment_count += ct.comments.where('created_at > ?', @last_notification_mail_sent).count
    end
    if comment_count.positive?
      subject += "#{comment_count} new comments and "
    end

    subject += "#{@notifications.count} new notifications on Shape "
    # TODO: Figure out user's timezone if we want to include the proper timestamp?
    # subject += "since#{@last_notification_mail_sent.strftime('%l:%M%P (%B %d, %Y)')}"

    mail to: @user.email, subject: subject
  end
end
