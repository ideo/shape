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
  validate :unique_parent_subgroup_path

  def self.find_or_create_path(parent_group_id:, path:, subgroup_id:)
    found = existing_group_hierarchy(
      parent_group_id: parent_group_id,
      path: path,
      subgroup_id: subgroup_id,
    )
    return found if found.present?

    GroupHierarchy.create(
      parent_group_id: parent_group_id,
      path: path,
      subgroup_id: subgroup_id,
    )
  end

  def self.existing_group_hierarchy(parent_group_id:, path:, subgroup_id:)
    where(
      parent_group_id: parent_group_id,
      subgroup_id: subgroup_id,
    ).where(
      'path @> ?', path.to_s
    ).first
  end

  def extend_path_to(extension)
    if extension.is_a? GroupHierarchy
      extended_path = extension.path.drop(1)
    elsif extension.is_a? Group
      extended_path = [extension.id]
    else
      return false
    end

    self.class.find_or_create_path(
      parent_group_id: parent_group_id,
      path: path + extended_path,
      subgroup_id: extended_path.last,
    )
  end

  def set_default_path
    return path if path.present?

    self.path = [parent_group, subgroup].map(&:id)
  end

  private

  def unique_parent_subgroup_path
    return unless path.present?

    found = self.class.existing_group_hierarchy(
      parent_group_id: parent_group_id,
      path: path,
      subgroup_id: subgroup_id,
    )
    return unless found.present?

    errors.add(:path, 'must be unique')
  end
end
