class CommentUpdater < SimpleService
  def initialize(comment:, message:, draftjs_data:)
    @comment = comment
    @message = message
    @draftjs_data = draftjs_data
  end

  def call
    update_comment

    if @comment.save
      @comment.store_in_firestore
      create_edited_activity
      return true
    end

    false
  end

  private

  def update_comment
    @comment.message = @message
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
end
