class UsersThread < ApplicationRecord
  belongs_to :user
  belongs_to :comment_thread

  before_create do
    self.last_viewed_at = Time.now
  end

  def update_last_viewed!
    update(last_viewed_at: Time.now)
  end
end
