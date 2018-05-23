class UsersThread < ApplicationRecord
  belongs_to :user
  belongs_to :comment_thread
end
