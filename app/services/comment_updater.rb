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
      return true
    end

    false
  end

  private

  def update_comment
    @comment.message = @message
    @comment.draftjs_data = @draftjs_data
  end
end
