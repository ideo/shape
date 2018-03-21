class Role < ApplicationRecord
  has_many :users_roles, dependent: :destroy
  has_many :users, through: :users_roles

  belongs_to :resource,
             polymorphic: true,
             optional: true

  after_create :add_to_children, if: :add_to_children?
  after_destroy :remove_from_children, if: :remove_from_children?
  before_save :set_resource_identifier

  validates :resource_type,
            inclusion: { in: Rolify.resource_types },
            allow_nil: true

  scopify

  attr_accessor :skip_children_callbacks

  VIEWER = :viewer
  EDITOR = :editor
  MEMBER = :member
  ADMIN = :admin

  amoeba do
    enable
    include_association :users_roles
    exclude_association :resource
    exclude_association :users
  end

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

  def duplicate!(assign_resource: nil)
    r = amoeba_dup
    r.resource = assign_resource if assign_resource.present?
    r.save
    r
  end

  # Builds a copy of this role - for changing the resource
  def build_copy(new_object)
    # Use amoeba_dup so it copies all associated users_roles
    new_role = amoeba_dup
    new_role.resource = new_object
    new_role
  end

  def resource_identifier
    "#{resource_type}_#{resource_id}"
  end

  def identifier
    [name, resource_identifier].select(&:present?).join('_')
  end

  def destroy_without_children_callbacks
    self.skip_children_callbacks = true
    destroy
  end

  private

  def add_to_children?
    return false if skip_children_callbacks

    resource.is_a?(Item) || resource.is_a?(Collection)
  end

  def remove_from_children?
    add_to_children?
  end

  def add_to_children
    AddRolesToChildrenWorker.perform_async([id], resource_id, resource_type)
  end

  def remove_from_children
    RemoveRolesFromChildrenWorker.perform_async([id], resource_id, resource_type)
  end

  def set_resource_identifier
    self.resource_identifier = resource_identifier
  end
end
