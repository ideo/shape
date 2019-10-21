class CommentCreator < SimpleService
  def initialize(
    comment_thread:,
    message:,
    draftjs_data:,
    author:,
    subject_id: nil,
    subject_type: nil,
    parent: nil
  )
    @comment_thread = comment_thread
    @message = message
    @draftjs_data = draftjs_data
    @author = author
    @parent = parent
    @comment = nil
    @subject = nil
    @status = nil
    if subject_type.present?
      @subject = subject_type.safe_constantize&.find_by_id(subject_id)
      @status = :opened
    end
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
      subject: @subject,
      parent: @parent,
      status: @status,
    )
  end
end
