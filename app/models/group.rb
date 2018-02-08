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

  def primary?
    organization.primary_group_id == id
  end
end
