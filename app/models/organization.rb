class Organization < ApplicationRecord
  RECENTLY_ACTIVE_RANGE = 90.days
  DEFAULT_TRIAL_ENDS_AT = 90.days
  DEFAULT_TRIAL_USERS_COUNT = 25
  PRICE_PER_USER = 5.00

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
  belongs_to :getting_started_collection,
             class_name: 'Collection::Global',
             dependent: :destroy,
             optional: true

  after_create :create_groups
  before_update :parse_domain_whitelist
  after_update :update_network_name, :update_group_names, if: :saved_change_to_name?
  after_update :check_guests_for_domain_match, if: :saved_change_to_domain_whitelist?
  after_update :update_subscription, if: :saved_change_to_in_app_billing?

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

    check_user_email_domain(user)

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

  # NOTE: even if none of these work it will fallback to handle-UUID
  def slug_candidates
    [
      :handle,
      [:handle, 1],
      [:handle, 2],
      %i[handle id],
      :name,
      [:name, 1],
      [:name, 2],
    ]
  end

  # NOTE: use #users.active to filter to active only
  def users
    User.where(id: (
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

  def create_network_organization(admin = nil)
    NetworkApi::Organization.create(
      external_id: id,
      name: name,
      admin_user_uid: admin.try(:uid),
    )
  end

  def find_or_create_on_network(admin = nil)
    return network_organization if network_organization.present?

    create_network_organization(admin)
  end

  def create_network_subscription
    plan = NetworkApi::Plan.first
    payment_method = NetworkApi::PaymentMethod.find(
      organization_id: network_organization.id,
      default: true,
    ).first
    NetworkApi::Subscription.create(
      organization_id: network_organization.id,
      plan_id: plan.id,
      payment_method_id: payment_method.try(:id),
    )
  end

  def calculate_active_users_count!
    count = users.active
                 .where('last_active_at > ?', RECENTLY_ACTIVE_RANGE.ago)
                 .count
    update_attributes(active_users_count: count)
  end

  def within_trial_period?
    return false unless trial_ends_at

    trial_ends_at > Time.current
  end

  def trial_users_exceeded?
    active_users_count > trial_users_count
  end

  def create_network_usage_record
    calculate_active_users_count!
    return true unless in_app_billing

    count = active_users_count

    if within_trial_period?
      return true unless count > DEFAULT_TRIAL_USERS_COUNT

      count -= DEFAULT_TRIAL_USERS_COUNT
    end

    if NetworkApi::UsageRecord.create(
      quantity: count,
      timestamp: Time.current.end_of_day.to_i,
      external_organization_id: id,
    )
      true
    else
      false
    end
  rescue JsonApiClient::Errors::ServerError
    false
  end

  def update_payment_status
    payment_method = NetworkApi::PaymentMethod.find(
      organization_id: network_organization.id,
      default: true,
    ).first
    update_attributes!(
      has_payment_method: payment_method ? true : false,
      overdue_at: payment_method ? nil : overdue_at,
    )
  end

  def find_or_create_user_getting_started_collection(user, synchronous: false)
    return if getting_started_collection.blank?

    user_collection = user.current_user_collection(id)
    # should find it even if you had archived it
    existing = Collection.find_by(
      created_by: user,
      organization: self,
      cloned_from: getting_started_collection,
    )
    return existing if existing.present?

    user_getting_started = getting_started_collection.duplicate!(
      for_user: user,
      parent: user_collection,
      system_collection: true,
      synchronous: synchronous,
    )

    # Change from Collection::Global to regular colleciton
    user_getting_started.update_attributes(type: nil)
    user_getting_started = user_getting_started.becomes(Collection)

    CollectionCardBuilder.new(
      params: {
        # put it after SharedWithMe
        order: 1,
        collection_id: user_getting_started.id,
      },
      parent_collection: user_collection,
      user: user,
    ).create
    user_collection.reorder_cards!
    user_getting_started
  end

  def check_user_email_domain(user)
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
  end

  private

  def should_generate_new_friendly_id?
    slug.blank? && handle.present?
  end

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
    primary_group = create_primary_group(name: name, organization: self)
    guest_group = create_guest_group(name: guest_group_name, organization: self, handle: guest_group_handle)
    admin_group = create_admin_group(name: admin_group_name, organization: self, handle: admin_group_handle)
    update_columns(
      primary_group_id: primary_group.id,
      guest_group_id: guest_group.id,
      admin_group_id: admin_group.id,
    )
  end

  def update_group_names
    primary_group.update_attributes(name: name)
    guest_group.update_attributes(name: guest_group_name, handle: guest_group_handle)
    admin_group.update_attributes(name: admin_group_name, handle: admin_group_handle)
  end

  def update_network_name
    return true unless network_organization.present?

    network_organization.name = name
    network_organization.save
  end

  def cancel_network_subscription
    subscription = NetworkApi::Subscription.find(
      organization_id: network_organization.id,
      active: true,
    ).first
    subscription.cancel(immediately: true)
  end

  def update_subscription
    if in_app_billing
      create_network_subscription
    else
      cancel_network_subscription
    end
  end
end
