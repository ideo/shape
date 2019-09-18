# == Schema Information
#
# Table name: group_hierarchies
#
#  id              :bigint(8)        not null, primary key
#  path            :jsonb
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
  belongs_to :subgroup, class_name: 'Group'

  before_create :set_default_path

  def extend_path_to(extension)
    if extension.is_a? GroupHierarchy
      extended_path = extension.path.drop(1)
    elsif extension.is_a? Group
      extended_path = [extension.id]
    else
      return false
    end

    GroupHierarchy.find_or_create_by(
      parent_group: parent_group,
      path: path + extended_path,
      subgroup_id: extended_path.last,
    )
  end

  def set_default_path
    return path if path.present?

    self.path = [parent_group, subgroup].map(&:id)
  end
end
