# == Schema Information
#
# Table name: organizations
#
#  id                                    :bigint(8)        not null, primary key
#  active_users_count                    :integer          default(0), not null
#  autojoin_domains                      :jsonb
#  deactivated                           :boolean          default(FALSE), not null
#  default_locale                        :string           default("en")
#  domain_whitelist                      :jsonb
#  has_payment_method                    :boolean          default(FALSE), not null
#  in_app_billing                        :boolean          default(TRUE), not null
#  name                                  :string
#  overdue_at                            :datetime
#  sent_high_charges_high_email          :boolean          default(FALSE), not null
#  sent_high_charges_low_email           :boolean          default(FALSE), not null
#  sent_high_charges_middle_email        :boolean          default(FALSE), not null
#  slug                                  :string
#  terms_version                         :integer
#  trial_ends_at                         :datetime
#  trial_expired_email_sent              :boolean          default(FALSE), not null
#  trial_users_count                     :integer          default(0), not null
#  trial_users_count_exceeded_email_sent :boolean          default(FALSE), not null
#  created_at                            :datetime         not null
#  updated_at                            :datetime         not null
#  admin_group_id                        :integer
#  filestack_file_id                     :integer
#  getting_started_collection_id         :integer
#  guest_group_id                        :integer
#  network_subscription_id               :string
#  primary_group_id                      :integer
#  profile_collection_id                 :integer
#  profile_template_id                   :integer
#  template_collection_id                :integer
#  terms_text_item_id                    :bigint(8)
#
# Indexes
#
#  index_organizations_on_autojoin_domains  (autojoin_domains) USING gin
#  index_organizations_on_slug              (slug) UNIQUE
#

class Organization < ApplicationRecord
  RECENTLY_ACTIVE_RANGE = 90.days
  DEFAULT_TRIAL_ENDS_AT = 30.days
  DEFAULT_TRIAL_USERS_COUNT = 25
  FREEMIUM_USER_LIMIT = 5
  PRICE_PER_USER = 5.00
  SUPER_ADMIN_EMAIL = ENV['SUPER_ADMIN_EMAIL'] || 'admin@shape.space'.freeze

  include Resourceable
  include Externalizable
  extend FriendlyId
  friendly_id :slug_candidates, use: %i[slugged finders history]

  has_many :collections, dependent: :destroy
  has_many :items, through: :collections, dependent: :destroy
  has_many :groups, dependent: :destroy
  has_many :api_tokens, dependent: :destroy
  has_many :application_organizations, dependent: :destroy
  has_many :audience_organizations, dependent: :destroy
  ## TODO scope this relation to just organization grouped datasets?
  ## TODO is this used?
  has_many :org_wide_question_datasets, class_name: 'Dataset::Question'
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
  belongs_to :terms_text_item,
             class_name: 'Item::TextItem',
             dependent: :destroy,
             optional: true

  resourceable roles: [Role::APPLICATION_USER],
               edit_role: '',
               view_role: Role::APPLICATION_USER

  after_create :create_groups
  before_update :parse_domain_whitelist
  after_update :update_network_name, :update_group_names, if: :saved_change_to_name?
  after_update :check_guests_for_domain_match, if: :saved_change_to_domain_whitelist?
  after_update :update_subscription, if: :saved_change_to_in_app_billing?
  after_update :update_deactivated, if: :saved_change_to_deactivated?

  delegate :admins, :members, :handle,
           to: :primary_group, allow_nil: true

  validates :name, presence: true

  # must start with a letter, can include letters/numbers/dashes/underscore
  SLUG_FORMAT = /\A\d*[a-zA-Z][a-zA-Z0-9_\-\.]*\z/i.freeze
  SLUG_LENGTH = (1..50).freeze
  validates :slug,
            length: { within: SLUG_LENGTH, allow_blank: true },
            format: { with: SLUG_FORMAT, allow_blank: true }

  scope :active, -> { where(deactivated: false) }
  scope :billable, -> do
    active
      .where(in_app_billing: true)
      .where(arel_table[:active_users_count].gt(FREEMIUM_USER_LIMIT))
  end
  scope :overdue, -> do
    billable
      .where.not(overdue_at: nil)
  end

  def self.display_name
    'Organization'
  end

  def can_view?(user)
    return true if user.has_role?(Role::APPLICATION_USER, self)

    primary_group.can_view?(user) || admin_group.can_view?(user) || guest_group.can_view?(user)
  end

  def can_edit?(user)
    primary_group.can_edit?(user) || admin_group.can_edit?(user) || guest_group.can_edit?(user)
  end

  # NOTE: this method can be called many times for the same org
  def setup_user_membership_and_collections(user, synchronous: false)
    # make sure they're on the org
    user_collection = Collection::UserCollection.find_or_create_for_user(user, self)
    setup_user_membership(user)

    # Don't add any shared content for application bots
    return if user.application_bot?

    # Create the getting started content for new users
    if user_collection.is_a?(Collection::UserCollection) &&
       user_collection.newly_created
      create_user_getting_started_content(user, synchronous: synchronous)
    end
    add_shared_with_org_collections(user) if primary_group.can_view?(user)
  end

  # This gets called from Roles::MassRemove after leaving a primary/guest group
  def remove_user_membership(user)
    # asynchronously remove all other roles e.g. collections, items, groups
    Roles::RemoveUserRolesFromOrganization.call(self, user)
    profile = Collection::UserProfile.find_by(user: user, organization: self)
    profile.archive! if profile.present?

    # Remove last_active_at for org they are being removed from
    timestamps = user.last_active_at.except(self.id.to_s)
    user.update_columns(last_active_at: timestamps)
    # Set current org as one they are a member of
    # If nil, that is fine as they shouldn't have a current organization
    user.switch_to_organization(user.organizations.first)
  end

  def matches_domain_whitelist?(user)
    email_domain = user.email.split('@').last
    (domain_whitelist + autojoin_domains).uniq.include?(email_domain)
  end

  def setup_user_membership(user)
    # make sure they have a User Profile
    if profile_template.present? && user.active?
      Collection::UserProfile.find_or_create_for_user(user: user, organization: self)
    end

    check_email_domains_and_join_org_group(user)

    # Set this as the user's current organization if they don't have one
    user.switch_to_organization(self) if user.current_organization_id.blank?
  end

  def add_shared_with_org_collections(user)
    collections_to_share = collections.where(shared_with_organization: true)
    return unless collections_to_share.any?

    LinkToSharedCollectionsWorker.perform_async(
      [user.id],
      [],
      collections_to_share.map(&:id),
      [],
    )
  end

  def setup_bot_user_membership(user)
    user.add_role(Role::APPLICATION_USER, self)
    user.switch_to_organization(self) if user.current_organization_id.blank?
  end

  def guest_group_name
    "#{name} Guests"
  end

  def admin_group_name
    "#{name} Admins"
  end

  def guest_group_handle
    "#{handle.slice(0, 28)}-guests"
  end

  def admin_group_handle
    "#{handle.slice(0, 28)}-admins"
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
      admin_user_uid: admin.try(:uid) || '',
      enterprise: !in_app_billing,
    )
  end

  def find_or_create_on_network(admin = nil)
    return network_organization if network_organization.present?

    create_network_organization(admin)
  end

  def create_network_subscription
    plan = NetworkApi::Plan.first
    subscription_params = {
      organization_id: network_organization.id,
      plan_id: plan.id,
    }
    payment_method = network_default_payment_method
    if payment_method
      subscription_params[:payment_method_id] = payment_method.id
    end
    NetworkApi::Subscription.create(subscription_params)
  end

  def network_default_payment_method
    return unless network_organization.present?

    @network_default_payment_method ||= NetworkApi::PaymentMethod.find(
      organization_id: network_organization.id,
      default: true,
    ).first
  end

  def within_trial_period?
    return false unless trial_ends_at

    trial_ends_at > Time.current
  end

  def trial_users_exceeded?
    active_users_count > trial_users_count
  end

  def update_payment_status
    payment_method = network_default_payment_method
    update_attributes!(
      has_payment_method: payment_method ? true : false,
      overdue_at: payment_method ? nil : overdue_at,
    )
  end

  def create_user_getting_started_content(user, synchronous: false)
    return if getting_started_collection.blank?

    user_collection = user.current_user_collection(id)

    # this will copy them to the beginning
    getting_started_collection.copy_all_cards_into!(
      user_collection,
      synchronous: synchronous,
      # allows copies to continue even if the user can't view the original content
      system_collection: true,
    )
    user_collection.save if user_collection.cached_attributes.delete 'awaiting_first_user_content'
    user_collection
  end

  # NOTE: can remove this legacy method once all orgs are migrated
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
        order: 0,
        collection_id: user_getting_started.id,
      },
      parent_collection: user_collection,
      user: user,
    ).create
    user_collection.reorder_cards!
    user_getting_started
  end

  def check_email_domains_and_join_org_group(user)
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

  def create_terms_text_item
    item = Item.create(
      type: 'Item::TextItem',
      name: "#{name} Terms",
      content: 'Terms',
      data_content: { ops: [] },
    )
    admin_group.add_role(Role::EDITOR, item)
    self.terms_text_item = item
    save
    item
  end

  def bump_terms_version
    self.terms_version = 0 if terms_version.nil?
    self.terms_version += 1
    save
  end

  def roles_anchor_collection_id
    nil
  end

  def admin_users
    User.find(admin_group.user_ids)
  end

  def days_before_payment_added
    # Should this check against all possible payment methods and not just default?
    payment_method = network_default_payment_method
    return 'No payment method' if payment_method.blank?

    (network_default_payment_method.created_at.to_date - created_at.to_date).to_i
  end

  def default_locale
    default_locale_in_database
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
    return unless network_organization

    subscription = NetworkApi::Subscription.find(
      organization_id: network_organization.id,
      active: true,
    ).first
    return unless subscription

    subscription.cancel(immediately: true)
  end

  def update_subscription
    if in_app_billing
      create_network_subscription
    else
      cancel_network_subscription
    end

    network_organization.update_attributes(
      enterprise: !in_app_billing,
    )
  end

  def update_deactivated
    if deactivated
      cancel_network_subscription
    else
      create_network_subscription
    end
  end
end
