class CommentResolver < SimpleService
  def initialize(comment:, user:, status:)
    @comment = comment
    @user = user
    @status = status
  end

  def call
    @comment.status = @status
    if @comment.subject.present? && @comment.subject.is_a?(Item::TextItem)
      TextItemHighlightUpdater.call(@comment, @status)
    end
    if @comment.save
      @comment.store_in_firestore
      create_resolved_activity
      return true
    end
    false
  end

  def create_resolved_activity
    ActivityAndNotificationBuilder.call(
      actor: @user,
      target: @comment.comment_thread.record,
      action: :resolved_comment,
      content: @comment.message,
    )
  end
end
