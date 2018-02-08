class Role < ApplicationRecord
  has_many :users_roles, dependent: :destroy
  has_many :users, through: :users_roles

  belongs_to :resource,
             polymorphic: true,
             optional: true

  validates :resource_type,
            inclusion: { in: Rolify.resource_types },
            allow_nil: true

  scopify

  # All the resources of a specific type (e.g. Organization) that this user is connected to
  # Role name is optional but can additionally scope it
  def self.all_resources_of_type(user:, resource_type:, role_name: nil)
    roles = joins(:user_roles)
            .where(UsersRole.arel_table[:user_id].eq(user.id))
            .where(resource_type: resource_type)
            .includes(:resource)

    roles = roles.where(name: role_name) if role_name.present?

    roles.map(&:resource).compact
  end
end
