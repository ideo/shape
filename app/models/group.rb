class Group < ApplicationRecord
  resourcify
  belongs_to :organization

  # Admins can manage people in the group
  def admins
    User.with_role(:admin, self)
  end

  # Members have read access to everything the group is linked to
  def members
    User.with_role(:member, self)
  end

  def admins_and_members
    User.joins(:roles)
        .where(Role.arel_table[:name].in(%i[admin member]))
        .where(Role.arel_table[:resource_type].in(self.class.name))
        .where(Role.arel_table[:resource_id].in(id))
  end

  def admin_and_member_ids
    admins_and_members.pluck(:id)
  end

  def primary?
    organization.primary_group_id == id
  end
end
