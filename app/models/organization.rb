class Organization < ApplicationRecord
  extend FriendlyId
  friendly_id :slug_candidates, use: %i[slugged finders history]

  has_many :collections, dependent: :destroy
  has_many :items, through: :collections, dependent: :destroy
  has_many :groups, dependent: :destroy
  belongs_to :primary_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true
  belongs_to :guest_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true
  belongs_to :admin_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true
  belongs_to :template_collection,
             class_name: 'Collection::Global',
             dependent: :destroy,
             optional: true
  belongs_to :profile_template,
             class_name: 'Collection',
             dependent: :destroy,
             optional: true
  belongs_to :profile_collection,
             class_name: 'Collection::Global',
             dependent: :destroy,
             optional: true

  after_create :create_groups
  before_update :parse_domain_whitelist
  after_update :update_group_names, if: :saved_change_to_name?
  after_update :check_guests_for_domain_match, if: :saved_change_to_domain_whitelist?

  delegate :admins, to: :primary_group
  delegate :members, to: :primary_group
  delegate :handle, to: :primary_group, allow_nil: true

  validates :name, presence: true

  def can_view?(user)
    primary_group.can_view?(user) || admin_group.can_view?(user) || guest_group.can_view?(user)
  end

  def can_edit?(user)
    primary_group.can_edit?(user) || admin_group.can_edit?(user) || guest_group.can_edit?(user)
  end

  def self.create_for_user(user)
    name = [user.first_name, user.last_name, 'Organization'].compact.join(' ')
    builder = OrganizationBuilder.new({ name: name }, user)
    builder.save
    builder.organization
  end

  # def self.update_network_organization_name(organization_id)
  #   organization = Organization.find(organization_id)
  #   network_organization = organization.network_organization
  #   return unless network_organization.present?
  #   network_organization.name = organization.name
  #   network_organization.save
  # end

  # NOTE: this method can be called many times for the same org
  def setup_user_membership_and_collections(user)
    # make sure they're on the org
    Collection::UserCollection.find_or_create_for_user(user, self)
    setup_user_membership(user)
  end

  # This gets called from Roles::MassRemove after leaving a primary/guest group
  def remove_user_membership(user)
    # asynchronously remove all other roles e.g. collections, items, groups
    Roles::RemoveUserRolesFromOrganization.call(self, user)
    profile = Collection::UserProfile.find_by(user: user, organization: self)
    profile.archive! if profile.present?

    if user.organizations.count.zero?
      Organization.create_for_user(user)
    end

    # Set current org as one they are a member of
    # If nil, that is fine as they shouldn't have a current organization
    user.switch_to_organization(user.organizations.first)
  end

  def matches_domain_whitelist?(user)
    email_domain = user.email.split('@').last
    domain_whitelist.include? email_domain
  end

  def setup_user_membership(user)
    # make sure they have a User Profile
    if profile_template.present? && user.active?
      Collection::UserProfile.find_or_create_for_user(user: user, organization: self)
    end

    if matches_domain_whitelist?(user)
      # add them as an org member
      user.add_role(Role::MEMBER, primary_group)
      # remove guest role if exists, do this second so that you don't temporarily lose org membership
      user.remove_role(Role::MEMBER, guest_group)
    elsif !primary_group.can_view?(user)
      # or else as a guest member if their domain doesn't match,
      # however if they've already been setup as an org member then they don't get "demoted"
      user.add_role(Role::MEMBER, guest_group)
    end
    # Set this as the user's current organization if they don't have one
    user.switch_to_organization(self) if user.current_organization_id.blank?
  end

  def guest_group_name
    "#{name} Guests"
  end

  def admin_group_name
    "#{name} Admins"
  end

  def guest_group_handle
    "#{handle}-guest"
  end

  def admin_group_handle
    "#{handle}-admins"
  end

  def slug_candidates
    [
      :handle,
      :name,
      [:handle, 1],
      [:name, 1],
      [:handle, 2],
      [:name, 2],
      %i[handle id],
    ]
  end

  def all_active_users
    User.active.where(id: (
      primary_group.user_ids +
      guest_group.user_ids
    ))
  end

  def create_profile_master_template(attrs = {})
    create_profile_template(
      attrs.merge(
        organization: self,
        master_template: true,
      ),
    )
  end

  def network_organization
    @network_organization ||= NetworkApi::Organization.find_by_external_id(id)
  end

  def find_or_create_on_network(admin = nil)
    return network_organization if network_organization.present?
    create_network_organization(admin)
  end

  def create_network_organization(admin = nil)
    NetworkApi::Organization.create(
      external_id: id,
      name: name,
      admin_user_uid: admin.try(:uid),
    )
  end

  private

  def parse_domain_whitelist
    return true unless will_save_change_to_domain_whitelist?
    if domain_whitelist.is_a?(String)
      # when saving from the frontend/API we just pass in a string list of domains,
      # so we split to save as an array
      self.domain_whitelist = domain_whitelist.split(',').map(&:strip)
    end
    domain_whitelist
  end

  def check_guests_for_domain_match
    guest_group.members[:users].each do |user|
      setup_user_membership(user)
    end
  end

  def create_groups
    create_primary_group(name: name, organization: self)
    create_guest_group(name: guest_group_name, organization: self, handle: guest_group_handle)
    create_admin_group(name: admin_group_name, organization: self, handle: admin_group_handle)
    save # Save primary group attr
  end

  def update_group_names
    primary_group.update_attributes(name: name)
    guest_group.update_attributes(name: guest_group_name, handle: guest_group_handle)
    admin_group.update_attributes(name: admin_group_name, handle: admin_group_handle)
  end

  # Adds all admin users for this org to the network,
  # so they can administer payment methods + invoices
  # def add_roles_to_network
  #   admin_group.user_ids.each do |user_id|
  #     user = User.find(user_id)
  #     NetworkOrganizationUserSyncWorker.perform_async(
  #       user.uid, id, NetworkApi::Organization::ADMIN_ROLE, :add
  #     )
  #   end
  # end

  # def network_subscription
  #   return @network_subscription if @network_subscription.present?
  #   if network_subscription_id.present?
  #     @network_subscription = NetworkApi::Subscription.find(
  #       network_subscription_id,
  #     ).first
  #   else
  #     @network_subscription = NetworkApi::Subscription.where(
  #       organization_id: network_organization.id,
  #       active: true,
  #     ).first
  #   end
  # end

end
