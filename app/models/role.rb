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

  VIEWER = :viewer
  EDITOR = :editor
  MEMBER = :member
  ADMIN = :admin

  # All the resources of a specific type (e.g. Organization) that this user is connected to
  # Role name is optional but can additionally scope it
  def self.user_resources(user:, resource_type:, role_name: nil)
    roles = joins(:users_roles)
            .where(UsersRole.arel_table[:user_id].eq(user.id))
            .where(resource_type: resource_type)
            .includes(:resource)

    roles = roles.where(name: role_name) if role_name.present?

    roles.map(&:resource).compact
  end

  def self.object_identifier(obj)
    [obj.class.base_class.to_s, obj.id].select(&:present?).join('_')
  end

  def self.role_identifier(role_name:, resource_identifier:)
    [role_name, resource_identifier].select(&:present?).join('_')
  end

  def resource_identifier
    "#{resource_type}_#{resource_id}"
  end

  def identifier
    [name, resource_identifier].select(&:present?).join('_')
  end
end
