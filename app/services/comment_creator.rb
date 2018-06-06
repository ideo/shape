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
    add_author_as_follower_of_thread if @comment
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
    users_thread = @comment_thread.add_user_follower!(@author.id)
    return unless users_thread.present?
    users_thread.update_last_viewed!
  end
end
