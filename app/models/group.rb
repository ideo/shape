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
        .where(Role.arel_table[:name].in([:admin, :member]))       
  end

  # Guests can access the org's space, but don't have access
  # to anything they aren't explicitly invited to
  def guests
    User.with_role(:guest, self)
  end

  def primary?
    organization.primary_group_id == id
  end
end
