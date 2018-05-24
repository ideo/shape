class GroupsThread < ApplicationRecord
  belongs_to :group
  belongs_to :comment_thread

  # only gets called via comment_thread#add_follower
  def add_users_as_followers!
    group.users.each do |user|
      comment_thread.add_user_follower!(user)
    end
  end
end
