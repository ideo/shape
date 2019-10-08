class CommentUpdater < SimpleService
  def initialize(comment:, message:, status:, draftjs_data:)
    @comment = comment
    @message = message
    @status = status
    @draftjs_data = draftjs_data
    @previous_mentions = comment.mentions
  end

  def call
    update_comment

    if @comment.save
      @comment.store_in_firestore
      create_edited_activity
      create_mention_notifications
      return true
    end

    false
  end

  private

  def update_comment
    @comment.message = @message
    @comment.status = @status
    @comment.draftjs_data = @draftjs_data
  end

  def create_edited_activity
    ActivityAndNotificationBuilder.call(
      actor: @comment.author,
      target: @comment.comment_thread.record,
      action: :edited_comment,
      content: @comment.message,
    )
  end

  def create_mention_notifications
    mentions = @comment.mentions
    newly_mentioned_user_ids = mentions[:user_ids] - @previous_mentions[:user_ids]
    newly_mentioned_group_ids = mentions[:group_ids] - @previous_mentions[:group_ids]
    return unless newly_mentioned_user_ids.present? || newly_mentioned_group_ids.present?

    ActivityAndNotificationBuilder.call(
      actor: @comment.author,
      target: @comment.comment_thread.record,
      action: :mentioned,
      subject_user_ids: newly_mentioned_user_ids,
      subject_group_ids: newly_mentioned_group_ids,
      combine: true,
      content: @comment.message,
    )
  end
end
