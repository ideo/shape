class Comment < ApplicationRecord
  paginates_per 10
  belongs_to :comment_thread, touch: true
  belongs_to :author, class_name: 'User'

  validates :message, presence: true
end
