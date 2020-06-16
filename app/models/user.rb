# == Schema Information
#
# Table name: users
#
#  id                          :bigint(8)        not null, primary key
#  cached_attributes           :jsonb
#  current_sign_in_at          :datetime
#  current_sign_in_ip          :inet
#  email                       :string           default("")
#  encrypted_password          :string           default(""), not null
#  feedback_contact_preference :integer          default("feedback_contact_unanswered")
#  first_name                  :string
#  handle                      :string
#  invitation_token            :string
#  last_active_at              :jsonb
#  last_name                   :string
#  last_notification_mail_sent :datetime
#  last_sign_in_at             :datetime
#  last_sign_in_ip             :inet
#  locale                      :string
#  mailing_list                :boolean          default(FALSE)
#  network_data                :jsonb
#  notify_through_email        :boolean          default(TRUE)
#  phone                       :string
#  provider                    :string
#  remember_created_at         :datetime
#  shape_circle_member         :boolean          default(FALSE)
#  show_helper                 :boolean          default(TRUE)
#  show_move_helper            :boolean          default(TRUE)
#  show_template_helper        :boolean          default(TRUE)
#  sign_in_count               :integer          default(0), not null
#  status                      :integer          default("active")
#  terms_accepted_data         :jsonb
#  uid                         :string
#  user_settings_data          :jsonb            not null
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  current_organization_id     :integer
#  current_user_collection_id  :integer
#
# Indexes
#
#  index_users_on_email             (email)
#  index_users_on_handle            (handle)
#  index_users_on_invitation_token  (invitation_token)
#  index_users_on_provider_and_uid  (provider,uid) UNIQUE
#

class User < ApplicationRecord
  prepend RolifyExtensions # Prepend so it can call rolify methods using super

  rolify after_add: :after_role_update,
         after_remove: :after_role_update,
         strict: true
  # alias created just to give equivalent method on users/groups
  alias rolify_roles roles

  store_accessor :cached_attributes,
                 :cached_user_profiles

  # list out all attributes here that we want to cache from Network
  store_accessor :network_data,
                 :picture,
                 :picture_medium,
                 :picture_large

  store_accessor :terms_accepted_data,
                 :terms_accepted,
                 :feedback_terms_accepted,
                 :respondent_terms_accepted,
                 :org_terms_accepted_versions

  store_accessor :user_settings_data,
                 :use_template_setting

  devise :database_authenticatable, :registerable, :trackable,
         :rememberable, :validatable, :omniauthable,
         omniauth_providers: [:ideo]

  has_many :users_roles, dependent: :destroy
  has_many :roles_for_collections,
           -> { where(resource_type: 'Collection') },
           through: :users_roles,
           source: :role,
           class_name: 'Role'
  has_many :collections,
           through: :roles_for_collections,
           source: :resource,
           source_type: 'Collection'
  has_many :roles_for_groups,
           -> { where(resource_type: 'Group') },
           through: :users_roles,
           source: :role,
           class_name: 'Role'
  has_many :groups,
           -> { active },
           through: :roles_for_groups,
           source: :resource,
           source_type: 'Group'
  has_many :current_org_groups,
           ->(u) { active.where(organization_id: u.current_organization_id) },
           through: :roles_for_groups,
           source: :resource,
           source_type: 'Group'

  has_many :organizations, -> { distinct }, through: :groups

  has_many :users_threads, dependent: :destroy
  has_many :comment_threads,
           through: :users_threads
  has_many :comments, foreign_key: :author_id
  has_many :activities_as_actor, class_name: 'Activity', inverse_of: :actor, foreign_key: :actor_id
  has_many :activities_as_subject, through: :activity_subjects, class_name: 'Activity'
  has_many :activity_subjects, as: :subject
  has_many :notifications
  has_many :survey_responses

  has_many :user_profiles,
           class_name: 'Collection::UserProfile',
           inverse_of: :created_by,
           foreign_key: :created_by_id
  has_one :application
  has_many :test_audience_invitations, dependent: :destroy

  belongs_to :current_organization,
             class_name: 'Organization',
             optional: true
  belongs_to :current_user_collection,
             class_name: 'Collection',
             optional: true

  has_many :test_audience_invitations
  has_many :network_invitations
  has_one :tag, dependent: :destroy

  validates :email,
            presence: true,
            uniqueness: true,
            format: { with: Devise.email_regexp },
            if: :email_required?
  validates :uid, :provider, presence: true, if: :active?
  validates :uid, uniqueness: { scope: :provider }, if: :active?

  after_save :update_profile_names, if: :saved_change_to_name?
  after_save :update_shape_circle_subscription, if: :saved_change_to_shape_circle_member?
  after_save :update_products_mailing_list_subscription, if: :saved_change_to_mailing_list?
  after_create :update_shape_user_list_subscription, if: :active?
  after_create :create_tag_from_handle, if: :active?
  after_update :update_shape_user_list_subscription_after_update, if: :saved_change_to_status?
  after_update :update_tag_after_update, if: :saved_change_to_handle?
  after_update :update_profile_locale, if: :should_update_network_user_locale?

  delegate :balance, to: :incentive_owed_account, prefix: true
  delegate :balance, to: :incentive_paid_account, prefix: true

  def saved_change_to_name?
    saved_change_to_first_name? || saved_change_to_last_name?
  end

  enum status: {
    # active = has an active (INA) login
    active: 0,
    # pending = was invited via email but has not yet logged in
    pending: 1,
    # archived = user was deleted from INA
    archived: 2,
    # limited = survey respondent user, does not have access to the full app
    limited: 3,
  }

  enum use_template_setting: {
    # add_to_my_collection = will not show the template helper; defaults to use template
    add_to_my_collection: 1,
    # let_me_place_it = will not show the template helper; defaults to let_me_place_it
    let_me_place_it: 2,
  }

  enum feedback_contact_preference: {
    feedback_contact_unanswered: 0,
    feedback_contact_yes: 1,
    feedback_contact_no: 2,
  }

  # to turn off devise validatable for uniqueness of email
  def will_save_change_to_email?
    false
  end

  # Searchkick Config
  # NOTE: if you change these settings e.g. word_start you must do User.reindex
  searchkick callbacks: false, word_start: %i[name handle email]
  after_commit :reindex
  alias searchkick_reindex reindex
  scope :search_import, -> do
    where(status: %i[active pending archived]).includes(:application)
  end

  def search_data
    {
      name: name&.downcase,
      handle: handle&.downcase,
      email: email_search_tokens,
      status: status,
      organization_ids: organization_ids,
      application_bot: application_bot?,
    }
  end

  def new_search_data
    {
      application_bot: application_bot?,
    }
  end

  alias organizations_through_groups organizations
  def organizations
    if application_bot?
      return application.organizations
    end

    organizations_through_groups
  end

  def application_bot?
    application.present?
  end

  def email_search_tokens
    parts = email.downcase.split('@')
    "#{email} #{parts.join(' ')}"
  end

  def should_index?
    !limited?
  end

  def should_reindex?
    # called after_commit
    (saved_changes.keys & %w[first_name last_name handle email status]).present?
  end

  def reindex(force: false)
    return unless should_reindex? || force

    Searchkick.callbacks(:async) do
      searchkick_reindex
    end
  end

  def self.all_active_except(user_id, in_org: nil)
    users = active.where.not(id: user_id).order(first_name: :asc)
    if in_org
      user_ids = in_org.primary_group.user_ids + in_org.guest_group.user_ids
      users = users.where(id: user_ids)
    end
    users
  end

  def self.find_or_initialize_from_external(attrs, provider)
    user = where(provider: provider, uid: attrs.uid).first

    unless user
      # if not found by provider, look up by email
      if attrs.type == 'User::Limited'
        if attrs.email.present?
          user = User.find_or_initialize_by(email: attrs.email)
        else
          user = User.find_or_initialize_by(phone: attrs.phone)
        end
        user.status = User.statuses[:limited]
      else
        user = User.find_or_initialize_by(email: attrs.email)
        # Users see terms on the Network, so we can mark them as accepted
        user.terms_accepted = true
      end
      user.invitation_token = nil
      user.password = Devise.friendly_token(40)
      user.password_confirmation = user.password
      user.provider = provider
      user.uid = attrs.uid
    end

    # Update user on every auth
    user.first_name = attrs.first_name
    user.last_name = attrs.last_name
    user.email = attrs.email
    user.phone = attrs.phone
    user.status = User.statuses[:active] unless user.limited?
    if attrs.try(:locale)
      user.locale = attrs.locale
    end

    unless user.limited?
      if attrs.present?
        user.handle = attrs.username
      elsif user.handle.blank?
        user.generate_handle
      end
    end
    %w[picture picture_medium picture_large].each do |field|
      user.network_data[field] = attrs.try(field) || attrs.try(:extra).try(field)
    end

    user
  end

  def self.from_omniauth(auth)
    user = Hashie::Mash.new(
      uid: auth.uid,
      type: auth.extra.raw_info.type,
      email: auth.info.email,
      phone: auth.extra.raw_info.phone,
      locale: auth.extra.raw_info.locale,
      first_name: auth.info.first_name,
      last_name: auth.info.last_name,
      username: auth.info.username,
      extra: auth.extra.raw_info,
    )
    find_or_initialize_from_external(user, auth.provider)
  end

  def self.find_or_initialize_from_network(network_user_auth)
    find_or_initialize_from_external(network_user_auth, 'ideo')
  end

  def self.create_pending_user(invitation:, organization_id:)
    pending_user = create(
      email: invitation.email,
      status: User.statuses[:pending],
      password: Devise.friendly_token(40),
    )
    return pending_user unless pending_user.persisted?

    pending_user.network_invitations.create(
      token: invitation.token,
      organization_id: organization_id,
    )
    pending_user
  end

  # Simplified format, used by action cable
  def as_json(_options = {})
    {
      id: id.to_s,
      name: name,
      pic_url_square: picture,
    }
  end

  def update_from_network_profile(params)
    %i[first_name last_name email picture picture_large locale].each do |field|
      send("#{field}=", params[field]) if params[field].present?
    end
    self.handle = params[:username] if params[:username].present?
    save
  end

  def generate_handle
    test_handle = name.downcase.delete ' '
    new_handle = test_handle
    existing = User.find_by_handle(test_handle)
    i = 0
    while existing
      i += 1
      new_handle = "#{test_handle}-#{i}"
      existing = User.find_by_handle(new_handle)
    end
    self.handle = new_handle
  end

  def name
    [first_name, last_name].compact.join(' ')
  end

  def self.basic_api_fields
    %i[
      id first_name last_name email status pic_url_square
    ]
  end

  def switch_to_organization(organization = nil)
    return if current_organization_id == organization&.id

    if organization.blank?
      self.current_organization = self.current_user_collection = nil
    else
      org_user_collection = current_user_collection(organization.id)
      return unless org_user_collection.present?

      self.current_user_collection = org_user_collection
      self.current_organization = organization
    end
    # make sure user picks up new roles / relationships
    save && reload
  end

  # overrides retrieval of belongs_to relation
  def current_user_collection(org_id = current_organization_id)
    return nil unless org_id

    type = bot_user? ? 'Application' : 'User'
    user_collection = collections.find_by(organization_id: org_id, type: "Collection::#{type}Collection")
    if user_collection.nil? && has_cached_role?(Role::SUPER_ADMIN)
      user_collection = Organization.find(org_id).template_collection
    end
    user_collection
  end

  def current_shared_collection(org_id = current_organization_id)
    return nil unless current_organization_id

    collections.shared_with_me.find_by_organization_id(org_id)
  end

  def organization_group_ids(organization)
    groups.where(organization_id: organization.id).pluck(:id)
  end

  def all_group_ids
    parent_group_ids = Group.parent_groups(group_ids).pluck(:id)
    # always include the Common Resource group as it may grant you access
    (group_ids + parent_group_ids + [Shape::COMMON_RESOURCE_GROUP_ID]).uniq
  end

  def all_current_org_group_ids
    current_org_parent_group_ids = Group.parent_groups(current_org_group_ids).pluck(:id)
    (current_org_group_ids + current_org_parent_group_ids + [Shape::COMMON_RESOURCE_GROUP_ID]).uniq
  end

  def role_via_current_org_groups(name, resource_identifier)
    Role.where(name: name, resource_identifier: resource_identifier)
        .joins(:groups_roles)
        .where(GroupsRole.arel_table[:group_id].in(all_current_org_group_ids))
  end

  def current_org_groups_and_special_groups
    if has_cached_role?(Role::SUPER_ADMIN)
      return current_organization.groups.not_global
    end
    return [] unless current_organization.present?

    groups = Group.where(id: all_current_org_group_ids).not_global.to_a
    return [] if groups.blank?

    organization = current_organization
    if groups.include?(organization.primary_group)
      # org members get to see the guest group
      groups << organization.guest_group
    elsif groups.include?(organization.guest_group)
      # org guests don't get to see the guest group
      groups = groups.reject { |g| g == organization.guest_group }
    end
    groups.compact.uniq
  end

  def unread_notifications
    Notification
      .joins(:activity)
      .where(Activity.arel_table[:organization_id].eq(
               current_organization_id,
             ))
      .where(
        user: self,
        read: false,
      )
  end

  def user_profile_for_org(organization_id)
    user_profiles.where(organization_id: organization_id).first
  end

  def add_network_admin(org_id)
    change_network_admin :add, org_id
  end

  def remove_network_admin(org_id)
    change_network_admin :remove, org_id
  end

  def in_my_collection?(item_or_collection)
    uc = current_user_collection
    # e.g. SuperAdmin doesn't always have a user collection
    return false unless uc.present?

    @in_my_collection ||= (
      uc.collections_and_linked_collections.select(:id, :name) + uc.items_and_linked_items.select(:id, :name)
    ).map(&:resource_identifier)
    if item_or_collection.breadcrumb.empty?
      @in_my_collection.include? item_or_collection.resource_identifier
    else
      @in_my_collection.include? "Collection_#{item_or_collection.breadcrumb.first}"
    end
  end

  def archive!
    archived!
    # NOTE: this is disabled, was creating way too many Zendesk tickets
    # DeprovisionUserWorker.perform_async(id)
  end

  def bot_user?
    application.present?
  end

  def network_user
    @network_user ||= NetworkApi::User.find(uid).first
  end

  def generate_network_auth_token
    return unless limited?
    return unless network_user.present?

    network_user.generate_auth_token.first.try(:authentication_token)
  rescue JsonApiClient::Errors::NotAuthorized
    # shouldn't happen since we are already escaping `unless limited?`
    nil
  end

  def incentive_owed_account
    DoubleEntry.account(:individual_owed, scope: self)
  end

  def incentive_paid_account
    DoubleEntry.account(:individual_paid, scope: self)
  end

  def incentive_due_date
    return if incentive_owed_account_balance.zero?

    lines = Accounting::Query.lines_for_account(incentive_owed_account, code: :incentive_owed, order: :desc)
    first_line_owed = nil
    # Iterate through lines to find when the balance was last zero
    lines.each do |line|
      break if line.balance.zero?

      first_line_owed = line
    end
    return if first_line_owed.blank?

    first_line_owed.created_at + Audience::PAYMENT_WAITING_PERIOD
  end

  # can return true, false, or 'outdated'
  def current_org_terms_accepted
    return true if current_organization.blank? ||
                   current_organization.terms_version.blank? ||
                   current_organization.terms_text_item.blank?

    user_accepted_version = org_terms_accepted_versions.try(:[], current_organization_id.to_s)
    if user_accepted_version
      return true if user_accepted_version == current_organization.terms_version

      return 'outdated'
    end
    false
  end

  def accept_current_org_terms
    self.org_terms_accepted_versions ||= {}
    self.org_terms_accepted_versions[current_organization_id.to_s] = current_organization.terms_version
    save
  end

  def last_active_at_in_org(org_id)
    date_string = last_active_at[org_id.to_s]
    return if date_string.nil?

    Time.parse(date_string)
  end

  def locale
    return locale_change.last if locale_changed?

    locale_in_database || current_organization&.default_locale
  end

  private

  def email_required?
    !limited?
  end

  def change_network_admin(action, org_id)
    # must have uid for network request
    return true unless uid
    return true if skip_network_actions?

    NetworkOrganizationUserSyncWorker.perform_async(
      uid, org_id, NetworkApi::Organization::ADMIN_ROLE, action
    )
  end

  def update_profile_names
    user_profiles.each do |profile|
      # call full update rather than update_all which skips callbacks
      profile.update(name: name)
    end
  end

  def should_update_network_user_locale?
    saved_change_to_locale? &&
      network_user.present? &&
      network_user.locale != locale
  end

  def update_profile_locale
    NetworkUserUpdateWorker.perform_async(id, :locale)
  end

  def update_products_mailing_list_subscription(subscribed: mailing_list)
    return if skip_network_actions?

    MailingListSubscriptionWorker.perform_async(id, :products_mailing_list, subscribed)
  end

  def update_shape_circle_subscription(subscribed: shape_circle_member)
    return if skip_network_actions?

    MailingListSubscriptionWorker.perform_async(id, :shape_circle, subscribed)
  end

  def update_shape_user_list_subscription(subscribed: true)
    return if skip_network_actions?

    MailingListSubscriptionWorker.perform_async(id, :shape_users, subscribed)
  end

  def update_shape_user_list_subscription_after_update
    prev_value = attribute_before_last_save(:status)
    # If now active and was previously not active (e.g. pending or limited)
    if active? && prev_value != 'active'
      update_shape_user_list_subscription(subscribed: true)
    # Or if they were active, and are now not (likely archived)
    elsif prev_value == 'active' && !active?
      update_shape_user_list_subscription(subscribed: false)
      if archived?
        update_shape_circle_subscription(subscribed: false)
        update_products_mailing_list_subscription(subscribed: false)
      end
    end
  end

  def create_tag_from_handle
    ActsAsTaggableOn::Tag.create(name: handle, tag_type: 'user', user: self)
  end

  def update_tag_after_update
    tag&.update(name: handle)
  end

  def after_role_update(role, _method)
    reset_cached_roles!
    resource = role.resource
    if resource.is_a?(Group) && role.resource.primary?
      # user added/removed from an org should update search index
      reindex(force: true)
    end
    # Reindex record if it is a searchkick model
    resource.reindex if resource && Searchkick.callbacks? && resource.searchable?
  end

  def sync_groups_after_adding(role)
    return unless role.resource.is_a?(Group)

    group = role.resource
    if group.primary? && role.name == Role::ADMIN.to_s
      unless has_role?(Role::ADMIN, group.organization.admin_group)
        add_role(Role::ADMIN, group.organization.admin_group)
        add_network_admin(group.organization.id)
      end
    elsif group.admin?
      unless has_role?(Role::ADMIN, group.organization.primary_group)
        add_role(Role::ADMIN, group.organization.primary_group)
        add_network_admin(group.organization.id)
      end
    end
  end

  def sync_groups_after_removing(role)
    return unless role.resource.is_a?(Group)

    group = role.resource
    if group.primary? && role.name == Role::ADMIN.to_s
      if has_role?(Role::ADMIN, group.organization.admin_group)
        remove_role(Role::ADMIN, group.organization.admin_group)
        remove_network_admin(group.organization.id)
      end
    elsif group.admin? && has_role?(Role::ADMIN, group.organization.primary_group)
      # if removing them from the admin group,
      # convert them back to a normal member of the org
      remove_role(Role::ADMIN, group.organization.primary_group)
      remove_network_admin(group.organization.id)
      add_role(Role::MEMBER, group.organization.primary_group)
    end
  end
end
