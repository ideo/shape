class Group < ApplicationRecord
  include Resourceable
  # Admins can manage people in the group
  # Members have read access to everything the group is linked to
  resourceable roles: %i[admin member]
  belongs_to :organization

  def admins_and_members
    User.joins(:roles)
        .where(Role.arel_table[:name].in([Role::ADMIN, Role::MEMBER]))
        .where(Role.arel_table[:resource_type].in(self.class.name))
        .where(Role.arel_table[:resource_id].in(id))
  end

  def admin_and_member_ids
    admins_and_members.pluck(:id)
  end

  def primary?
    organization.primary_group_id == id
  end

  def can_edit?(user)
    admin_ids.include?(user.id)
  end
end
