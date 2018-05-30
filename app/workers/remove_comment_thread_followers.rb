class RemoveCommentThreadFollowers
  include Sidekiq::Worker

  def perform(comment_thread_ids, user_ids = [], group_ids = [])
    @comment_threads = CommentThread.where(id: comment_thread_ids)
    @user_ids = user_ids
    @group_ids = group_ids
    if @comment_threads.count == 1 && (user_ids.empty? || group_ids.empty?)
      init_users_and_groups_from_thread(@comment_threads.first)
    end
    remove_followers
  end

  private

  def init_users_and_groups_from_thread(comment_thread)
    # pull in all editors of the comment_thread's record
    editors = comment_thread.record.editors
    @user_ids = editors[:users].map(&:id)
    # don't include the primary group
    @group_ids = editors[:groups].reject(&:primary?).map(&:id)
  end

  def remove_followers
    @comment_threads.each do |comment_thread|
      comment_thread.remove_user_followers!(@user_ids)
      comment_thread.remove_group_followers!(@group_ids)
    end
  end
end
