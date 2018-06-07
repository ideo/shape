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
      # TODO: create notifications for mentions
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
end
