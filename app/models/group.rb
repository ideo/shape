# == Schema Information
#
# Table name: groups
#
#  id                           :bigint(8)        not null, primary key
#  archive_batch                :string
#  archived                     :boolean          default(FALSE)
#  archived_at                  :datetime
#  autojoin_emails              :jsonb
#  handle                       :string
#  name                         :string
#  type                         :string
#  created_at                   :datetime         not null
#  updated_at                   :datetime         not null
#  application_id               :integer
#  created_by_id                :integer
#  current_shared_collection_id :integer
#  filestack_file_id            :integer
#  network_id                   :string
#  organization_id              :bigint(8)
#
# Indexes
#
#  index_groups_on_archive_batch    (archive_batch)
#  index_groups_on_autojoin_emails  (autojoin_emails) USING gin
#  index_groups_on_handle           (handle)
#  index_groups_on_network_id       (network_id)
#  index_groups_on_organization_id  (organization_id)
#  index_groups_on_type             (type)
#

class Group < ApplicationRecord
  include Resourceable
  include HasFilestackFile
  include Archivable
  include HasActivities
  include Externalizable
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

  # so far the only "org optional" group is the "Common Resource" group
  belongs_to :organization, optional: true
  belongs_to :application, optional: true
  belongs_to :current_shared_collection,
             class_name: 'Collection',
             optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  has_many :groups_threads

  has_many :group_hierarchies, foreign_key: 'parent_group_id'
  has_many :subgroups, class_name: 'Group', through: :group_hierarchies

  has_many :subgroup_memberships, class_name: 'GroupHierarchy', foreign_key: 'subgroup_id'
  has_many :parent_groups, class_name: 'Group', through: :subgroup_memberships

  has_many :activities_as_subject, through: :activity_subjects, class_name: 'Activity'
  has_many :activity_subjects, as: :subject

  before_validation :set_unique_handle, if: :validate_handle?

  validates :name, presence: true
  validates :organization_id, presence: true, if: :requires_org?

  validates :handle,
            uniqueness: { scope: :organization_id },
            if: :validate_handle?

  validates :handle,
            length: { within: Organization::SLUG_LENGTH },
            format: { with: Organization::SLUG_FORMAT },
            if: :validate_handle?

  # Searchkick Config
  searchkick callbacks: :async, word_start: %i[name handle]
  scope :search_import, -> { where(archived: false) }
  # includes global groups
  scope :viewable_in_org, ->(id) { where(organization_id: [nil, id]) }
  scope :not_global, -> { where(type: nil) }

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

  def self.identifiers
    # override resourceable method so that identifiers includes all subgroups
    includes(:subgroups).map { |g| [g] + g.subgroups }.flatten.uniq.map(&:resource_identifier)
  end

  def identifiers
    # uses the above method to get all subgroup identifiers for this group
    Group.where(id: id).identifiers
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

  def common_resource?
    false
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

  # just to make Groups play nice with resourceable shared methods
  def roles_anchor_collection_id
    nil
  end

  def requires_org?
    true
  end

  def update_from_network_profile(params)
    %i[name external_id].each do |field|
      send("#{field}=", params[field]) if params[field].present?
    end
    save
  end

  def avatar_url
    if filestack_file_signed_url.present?
      filestack_file_signed_url
    else
      'https://s3-us-west-2.amazonaws.com/assets.shape.space/group-avatar.png'
    end
  end

  def icon_url
    application&.group_icon_url
  end

  private

  def create_shared_collection
    shared = Collection::SharedWithMeCollection.create_for_group(
      organization,
    )
    update(current_shared_collection: shared)
  end

  # gets called from add/remove methods in rolify_extensions
  def after_role_update(role, method = nil)
    resource = role.resource
    # Reindex record if it is a searchkick model
    resource.reindex if resource && Searchkick.callbacks? && resource.searchable?
    return unless common_resource?

    if method == :add
      resource.update(common_viewable: true)
    elsif method == :remove
      resource.update(common_viewable: false)
    end
  end

  def validate_handle?
    new_record? ||
      will_save_change_to_name? ||
      will_save_change_to_handle?
  end

  def set_unique_handle
    return if handle.blank? && name.blank?

    self.handle ||= name
    # Make sure it is parameterized
    self.handle = handle.parameterize.slice(0, 36)
    original_handle = handle
    i = 0
    while groups_matching_handle.any?
      self.handle = "#{original_handle.slice(0, 33)}-#{i += 1}"
    end
  end

  def groups_matching_handle
    Group
      .where.not(id: id)
      .where(organization_id: organization_id, handle: handle)
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
