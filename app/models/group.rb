class Group < ApplicationRecord
  include Resourceable
  include HasFilestackFile
  include Archivable
  after_archive :after_archive_group

  prepend RolifyExtensions # Prepend so it can call rolify methods using super

  # Admins can manage people in the group
  # Members have read access to everything the group is linked to
  # This method must be above rolify method
  resourceable roles: [Role::ADMIN, Role::MEMBER],
               edit_role: Role::ADMIN,
               view_role: Role::MEMBER

  after_create :create_shared_collection

  rolify after_add: :after_add_role,
         after_remove: :after_remove_role,
         strict: true

  belongs_to :organization
  belongs_to :current_shared_collection,
              class_name: 'Collection',
              optional: true

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

  # really meant to be used on an AR Relation, where `select` is just the relevant records
  def self.user_ids
    identifiers = select(:id).map(&:resource_identifier)
    UsersRole
      .joins(:role)
      .where(Role.arel_table[:resource_identifier].in(identifiers))
      .pluck(:user_id)
      .uniq
  end

  # Roles where a user is admin/viewer of this group
  def roles_from_users
    Role.for_resource(self)
  end

  def primary?
    organization.primary_group_id == id
  end

  private

  def create_shared_collection
    shared = Collection::SharedWithMeCollection.create_for_group(
      self, organization)
    self.update(current_shared_collection: shared)
  end

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

  def after_archive_group
    remove_group_from_resources
    archive_group_handle
  end

  def remove_group_from_resources
    # TODO: how to do less here rather then call on every resource
    # an additional complication here: When you archive the group, you
    # could be on the current page of the resource it will be removed from
    # so technically you'd want it to be a synchronous remove, so you can
    # refetch the resource roles after the request is done.
    roles_to_resources.each do |role|
      Roles::MassRemove.new(
        object: role.resource,
        role_name: role.name,
        groups: [self],
      ).call
    end
  end

  def archive_group_handle
    update(handle: "#{handle}-archived-#{Time.now.to_i}")
  end
end
