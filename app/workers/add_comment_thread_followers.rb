class AddCommentThreadFollowers
  include Sidekiq::Worker

  # `comment_thread_ids` can also be a single id
  def perform(comment_thread_ids, user_ids = [], group_ids = [])
    @comment_threads = CommentThread.where(id: comment_thread_ids)
    @user_ids = user_ids
    @group_ids = group_ids
    if @comment_threads.count == 1 && (user_ids.empty? || group_ids.empty?)
      init_users_and_groups_from_thread(@comment_threads.first)
    end
    add_users_and_groups_as_followers
  end

  def init_users_and_groups_from_thread(comment_thread)
    # pull in all editors of the comment_thread's record
    editors = comment_thread.record.editors
    @user_ids = editors[:users].map(&:id)
    # don't include the primary group
    @group_ids = editors[:groups].reject(&:primary?).map(&:id)
  end

  def add_users_and_groups_as_followers
    @comment_threads.each do |comment_thread|
      @user_ids.each do |user_id|
        comment_thread.add_user_follower!(user_id)
      end
      @group_ids.each do |group_id|
        comment_thread.add_group_follower!(group_id)
      end
    end
  end
end
