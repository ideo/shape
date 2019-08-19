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
    CommentNotificationWorker.perform_async(@comment.id, @comment_thread.id, @author.id)
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
end
