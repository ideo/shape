class CommentCreator < SimpleService
  def initialize(comment_thread:, message:, draftjs_data:, author:)
    @comment_thread = comment_thread
    @message = message
    @draftjs_data = draftjs_data
    @author = author
    @comment = nil
  end

  def call
    create_comment
    if @comment
      add_author_as_follower_of_thread
      add_mentioned_users_as_follower_of_thread
      @comment.store_in_firestore
      create_notifications
    end
    @comment
  end

  private

  def create_comment
    @comment = @comment_thread.comments.create(
      message: @message,
      draftjs_data: @draftjs_data,
      author: @author,
    )
  end

  def add_author_as_follower_of_thread
    # this will find or create the users thread, which may already exist
    users_thread = @comment_thread.add_user_follower!(@author.id)
    return unless users_thread.present?
    # also mark the author as having viewed the thread
    users_thread.update_last_viewed!
  end

  def add_mentioned_users_as_follower_of_thread
    mentions = @comment.mentions
    mentions[:user_ids].each do |user_id|
      @comment_thread.add_user_follower!(user_id)
    end
    mentions[:group_ids].each do |group_id|
      @comment_thread.add_group_follower!(group_id)
    end
  end

  def create_notifications
    mentions = @comment.mentions
    if mentions[:user_ids].present? || mentions[:group_ids].present?
      ActivityAndNotificationBuilder.call(
        actor: @author,
        target: @comment_thread.record,
        action: :mentioned,
        subject_user_ids: mentions[:user_ids],
        subject_group_ids: mentions[:group_ids],
        combine: true,
        content: @comment.message,
      )
    end

    # if people were notified of the mention, don't need to also notify of the comment
    users = @comment.comment_thread.users_threads.pluck(:user_id)
    unmentioned_users = (users - mentions[:user_ids])
    groups = @comment.comment_thread.groups_threads.pluck(:group_id)
    unmentioned_groups = (groups - mentions[:group_ids])
    ActivityAndNotificationBuilder.call(
      actor: @author,
      target: @comment_thread.record,
      action: :commented,
      subject_user_ids: unmentioned_users,
      subject_group_ids: unmentioned_groups,
      # specifically skip over any mentioned users, for ex.
      # if they would have received a notification via their group(s)
      omit_user_ids: mentions[:user_ids],
      omit_group_ids: mentions[:group_ids],
      combine: true,
      content: @comment.message,
    )
  end
end
