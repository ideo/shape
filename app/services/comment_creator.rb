class CommentCreator < SimpleService
  def initialize(comment_thread:, message:, author:)
    @comment_thread = comment_thread
    @message = message
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
      author: @author,
    )
  end

  def add_author_as_follower_of_thread
    @comment_thread.add_follower!(@author)
  end
end
