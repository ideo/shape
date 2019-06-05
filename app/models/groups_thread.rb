# == Schema Information
#
# Table name: groups_threads
#
#  id                :bigint(8)        not null, primary key
#  created_at        :datetime         not null
#  comment_thread_id :bigint(8)
#  group_id          :bigint(8)
#
# Indexes
#
#  by_groups_comment_thread  (group_id,comment_thread_id) UNIQUE
#

class GroupsThread < ApplicationRecord
  belongs_to :group
  belongs_to :comment_thread
end
