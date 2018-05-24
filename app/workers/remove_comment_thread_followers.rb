class RemoveCommentThreadFollowers
  include Sidekiq::Worker

  def perform(comment_thread_ids, user_ids = [], group_ids = [])
    @comment_threads = CommentThread.where(id: comment_thread_ids)
    @comment_threads.each do |comment_thread|
      comment_thread.remove_user_followers!(user_ids)
      comment_thread.remove_group_followers!(group_ids)
    end
  end
end
