class UsersRole < ApplicationRecord
  belongs_to :user
  belongs_to :role

  # Does this user have any role on this resource?
  def self.any_role?(user:, resource:)
    where(
      user_id: user.id,
      role_id: resource.role_ids
    ).count.positive?
  end
end
