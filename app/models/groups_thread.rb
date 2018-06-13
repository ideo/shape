class GroupsThread < ApplicationRecord
  belongs_to :group
  belongs_to :comment_thread
end
