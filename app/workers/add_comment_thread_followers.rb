class AddCommentThreadFollowers
  include Sidekiq::Worker

  def perform(comment_thread_id)
    @comment_thread = CommentThread.find(comment_thread_id)
    add_editors_as_followers
  end

  def add_editors_as_followers
    editors = @comment_thread.record.editors
    editors[:users].each do |user|
      @comment_thread.add_user_follower!(user)
    end
    editors[:groups].each do |group|
      next if group.primary?
      @comment_thread.add_group_follower!(group)
    end
  end
end
