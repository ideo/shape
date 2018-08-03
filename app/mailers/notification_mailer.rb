class NotificationMailer < ApplicationMailer
  add_template_helper ApplicationHelper

  def notify(user_id:, last_notification_mail_sent:, notification_ids:, comment_thread_ids:)
    # this is passed in because by the time we look up the user, the value will have been changed
    # serialized as unix timestamp so we convert back to Time
    @last_notification_mail_sent = Time.at(last_notification_mail_sent)
    @user = User.find(user_id)
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
