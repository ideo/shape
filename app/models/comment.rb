class Comment < ApplicationRecord
  belongs_to :comment_thread, touch: true
  belongs_to :author, class_name: 'User'
end
