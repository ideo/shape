class Group < ApplicationRecord
  include Resourceable
  include HasFilestackFile
  prepend RolifyExtensions # Prepend so it can call rolify methods using super

  # Admins can manage people in the group
  # Members have read access to everything the group is linked to
  # This method must be above rolify method
  resourceable roles: [Role::ADMIN, Role::MEMBER],
               edit_role: Role::ADMIN,
               view_role: Role::MEMBER

  rolify after_add: :after_add_role,
         after_remove: :after_remove_role,
         strict: true

  belongs_to :organization

  before_validation :set_handle_if_none, on: :create

  validates :name, presence: true

  validates :handle,
            uniqueness: { scope: :organization_id },
            if: :validate_handle?

  validates :handle,
            format: { with: /[a-zA-Z0-9\-\_]+/ },
            if: :validate_handle?

  # Default for .roles are those where a
  # user is admin/member of this group
  def roles
    roles_from_users
  end

  def role_ids
    roles_from_users.pluck(:id)
  end

  # Roles where this group is an editor/viewer of a collection/item
  def roles_to_resources
    Role
      .joins(:groups_roles)
      .where(GroupsRole.arel_table[:group_id].in(id))
  end

  # Roles where a user is admin/viewer of this group
  def roles_from_users
    Role.for_resource(self)
  end

  def primary?
    organization.primary_group_id == id
  end

  private

  def after_add_role(role)
    resource = role.resource
    # Reindex record if it is a searchkick model
    resource.reindex if resource.respond_to?(:queryable) && queryable
  end

  def after_remove_role(role)
    resource = role.resource
    # Reindex record if it is a searchkick model
    resource.reindex if resource.respond_to?(:queryable) && queryable
  end

  def validate_handle?
    new_record? || handle_changed?
  end

  def set_handle_if_none
    self.handle ||= name.parameterize
  end
end
