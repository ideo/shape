# == Schema Information
#
# Table name: group_hierarchies
#
#  id              :bigint(8)        not null, primary key
#  path            :jsonb            not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  parent_group_id :bigint(8)
#  subgroup_id     :bigint(8)
#
# Indexes
#
#  index_group_hierarchies_on_parent_group_id  (parent_group_id)
#  index_group_hierarchies_on_path             (path) USING gin
#  index_group_hierarchies_on_subgroup_id      (subgroup_id)
#

class GroupHierarchy < ApplicationRecord
  belongs_to :parent_group, class_name: 'Group'
  belongs_to :granted_by, class_name: 'Group'
  belongs_to :subgroup, class_name: 'Group'
end
