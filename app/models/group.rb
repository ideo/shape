class Group < ApplicationRecord
  include Resourceable
  include HasFilestackFile
  include Archivable
  include HasActivities
  after_archive :after_archive_group

  prepend RolifyExtensions # Prepend so it can call rolify methods using super

  # Admins can manage people in the group
  # Members have read access to everything the group is linked to
  # This method must be above rolify method
  resourceable roles: [Role::ADMIN, Role::MEMBER],
               edit_role: Role::ADMIN,
               view_role: Role::MEMBER

  # alias the resourceable method so we can override with special guest group rules
  alias resourceable_can_view? can_view?
  alias resourceable_can_edit? can_edit?

  after_save :update_organization
  after_create :create_shared_collection

  rolify after_add: :after_role_update,
         after_remove: :after_role_update,
         strict: true
  # roles method gets overridden so we alias it here
  alias rolify_roles roles

  belongs_to :organization
  belongs_to :current_shared_collection,
             class_name: 'Collection',
             optional: true
  has_many :groups_threads

  has_many :activities_as_subject, through: :activity_subjects, class_name: 'Activity'
  has_many :activity_subjects, as: :subject

  before_validation :set_handle_if_none, on: :create

  validates :name, presence: true

  validates :handle,
            uniqueness: { scope: :organization_id },
            if: :validate_handle?

  validates :handle,
            # requires at least one letter in it
            format: { with: /[a-zA-Z0-9\-_]*[a-zA-Z][a-zA-Z0-9\-_]*/ },
            if: :validate_handle?

  # Searchkick Config
  searchkick callbacks: :async, word_start: %i[name handle]

  def search_data
    {
      name: name.downcase,
      handle: handle,
      # listing this way makes it easier to search Users/Groups together
      organization_ids: [organization_id],
    }
  end

  def should_index?
    active?
  end

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
      .where.not(resource_id: current_shared_collection_id)
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

  def guest?
    organization.guest_group_id == id
  end

  def admin?
    organization.admin_group_id == id
  end

  def org_group?
    [primary?, guest?, admin?].any?
  end

  def can_view?(user)
    # NOTE: guest group access can be granted via primary_group membership
    return true if guest? && organization.primary_group.can_view?(user)
    # otherwise pass through to the normal resourceable method
    resourceable_can_view?(user)
  end

  def can_edit?(user)
    return true if new_record?
    return true if guest? && organization.primary_group.can_edit?(user)
    # otherwise pass through to the normal resourceable method
    resourceable_can_edit?(user)
  end

  private

  def create_shared_collection
    shared = Collection::SharedWithMeCollection.create_for_group(
      organization,
    )
    update(current_shared_collection: shared)
  end

  def after_role_update(role)
    resource = role.resource
    # Reindex record if it is a searchkick model
    resource.reindex if resource && Searchkick.callbacks? && resource.searchable?
  end

  def validate_handle?
    new_record? || will_save_change_to_attribute?(:handle)
  end

  def set_handle_if_none
    self.handle ||= name.parameterize
  end

  def after_archive_group
    remove_group_from_resources
    archive_group_handle
    unfollow_group_users_from_group_threads
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

  def unfollow_group_users_from_group_threads
    thread_ids = groups_threads.pluck(:comment_thread_id)
    return if thread_ids.empty?
    RemoveCommentThreadFollowers.perform_async(
      thread_ids,
      user_ids,
    )
  end

  def update_organization
    return unless primary?
    # regenerate the org's slug if we're changing the primary handle
    organization.slug = nil if saved_change_to_handle?
    organization.update(name: name)
  end
end
