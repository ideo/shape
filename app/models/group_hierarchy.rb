# == Schema Information
#
# Table name: group_hierarchies
#
#  id              :bigint(8)        not null, primary key
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  granted_by_id   :bigint(8)
#  parent_group_id :bigint(8)
#  subgroup_id     :bigint(8)
#
# Indexes
#
#  index_group_hierarchies_on_granted_by_id    (granted_by_id)
#  index_group_hierarchies_on_parent_group_id  (parent_group_id)
#  index_group_hierarchies_on_subgroup_id      (subgroup_id)
#

class GroupHierarchy < ApplicationRecord
  belongs_to :parent_group, class_name: 'Group'
  belongs_to :granted_by, class_name: 'Group'
  belongs_to :subgroup, class_name: 'Group'
end
