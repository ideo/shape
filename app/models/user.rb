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
#  feedback_terms_accepted     :boolean          default(FALSE)
#  first_name                  :string
#  handle                      :string
#  invitation_token            :string
#  last_active_at              :datetime
#  last_name                   :string
#  last_notification_mail_sent :datetime
#  last_sign_in_at             :datetime
#  last_sign_in_ip             :inet
#  mailing_list                :boolean          default(FALSE)
#  network_data                :jsonb
#  notify_through_email        :boolean          default(TRUE)
#  phone                       :string
#  provider                    :string
#  remember_created_at         :datetime
#  respondent_terms_accepted   :boolean          default(FALSE)
#  shape_circle_member         :boolean          default(FALSE)
#  show_helper                 :boolean          default(TRUE)
#  show_move_helper            :boolean          default(TRUE)
#  show_template_helper        :boolean          default(TRUE)
#  sign_in_count               :integer          default(0), not null
#  status                      :integer          default("active")
#  terms_accepted              :boolean          default(FALSE)
#  uid                         :string
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  current_organization_id     :integer
#  current_user_collection_id  :integer
#
# Indexes
#
#  index_users_on_email             (email)
#  index_users_on_handle            (handle) UNIQUE
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

  devise :database_authenticatable, :registerable, :trackable,
         :rememberable, :validatable, :omniauthable,
         omniauth_providers: [:ideo]

  has_many :collections,
           through: :roles,
           source: :resource,
           source_type: 'Collection'
  has_many :groups,
           -> { active },
           through: :roles,
           source: :resource,
           source_type: 'Group'
  has_many :current_org_groups,
           ->(u) { active.where(organization_id: u.current_organization_id) },
           through: :roles,
           source: :resource,
           source_type: 'Group'
  has_many :users_threads, dependent: :destroy
  has_many :comment_threads,
           through: :users_threads

  has_many :organizations, -> { distinct }, through: :groups
  has_many :users_roles, dependent: :destroy
  has_many :comments, foreign_key: :author_id

  has_many :activities_as_actor, class_name: 'Activity', inverse_of: :actor, foreign_key: :actor_id
  has_many :activities_as_subject, through: :activity_subjects, class_name: 'Activity'
  has_many :activity_subjects, as: :subject
  has_many :notifications
  has_many :feedback_incentive_records

  has_many :user_profiles,
           class_name: 'Collection::UserProfile',
           inverse_of: :created_by,
           foreign_key: :created_by_id
  has_one :application

  belongs_to :current_organization,
             class_name: 'Organization',
             optional: true
  belongs_to :current_user_collection,
             class_name: 'Collection',
             optional: true

  validates :email, presence: true, uniqueness: true, if: :email_required?
  validates :uid, :provider, presence: true, if: :active?
  validates :uid, uniqueness: { scope: :provider }, if: :active?

  after_save :update_profile_names, if: :saved_change_to_name?
  after_save :update_mailing_list_subscription, if: :saved_change_to_mailing_list?

  def saved_change_to_name?
    saved_change_to_first_name? || saved_change_to_last_name?
  end

  enum status: {
    active: 0,
    pending: 1,
    archived: 2,
    limited: 3,
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
  searchkick callbacks: false, word_start: %i[name handle email]
  after_commit :reindex
  alias searchkick_reindex reindex
  scope :search_import, -> { where(status: %i[active pending]) }

  def search_data
    {
      name: name&.downcase,
      handle: handle&.downcase,
      email: email_search_tokens,
      status: status,
      organization_ids: organization_ids,
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
    active? || pending?
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
        user.status = User.statuses[:active]
      end
      user.invitation_token = nil
      user.password = Devise.friendly_token(40)
      user.password_confirmation = user.password
      user.provider = provider
      user.uid = attrs.uid
    end

    # Update user on every auth
    user.email = attrs.email
    user.phone = attrs.phone
    unless user.limited?
      if attrs.present?
        user.handle = attrs.username
      elsif user.handle.blank?
        user.generate_handle
      end
    end
    user.first_name = attrs.first_name
    user.last_name = attrs.last_name
    %w[picture picture_medium picture_large].each do |field|
      user.network_data[field] = attrs.try(:extra).try(field)
    end

    user
  end

  def self.from_omniauth(auth)
    user = Hashie::Mash.new(
      uid: auth.uid,
      type: auth.extra.raw_info.type,
      email:  auth.info.email,
      phone: auth.extra.raw_info.phone,
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

  def self.create_pending_user(email:)
    create(
      email: email,
      status: User.statuses[:pending],
      password: Devise.friendly_token(40),
      invitation_token: Devise.friendly_token(40),
    )
  end

  def self.pending_user_with_token(token)
    where(
      invitation_token: token,
      status: User.statuses[:pending],
    ).first
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
    %i[first_name last_name email picture picture_large].each do |field|
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
    collections.find_by(organization_id: org_id, type: "Collection::#{type}Collection")
  end

  def current_shared_collection(org_id = current_organization_id)
    return nil unless current_organization_id

    collections.shared_with_me.find_by_organization_id(org_id)
  end

  def organization_group_ids(organization)
    groups.where(organization_id: organization.id).pluck(:id)
  end

  def role_via_org_groups(name, resource_identifier)
    Role.where(name: name, resource_identifier: resource_identifier)
        .joins(:groups_roles)
        .where(GroupsRole.arel_table[:group_id].in(group_ids))
  end

  def role_via_current_org_groups(name, resource_identifier)
    Role.where(name: name, resource_identifier: resource_identifier)
        .joins(:groups_roles)
        .where(GroupsRole.arel_table[:group_id].in(current_org_group_ids))
  end

  def current_org_groups_and_special_groups
    if has_cached_role?(Role::SUPER_ADMIN)
      return current_organization.groups
    end

    groups = current_org_groups.to_a
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

  def current_incentive_balance
    last_record = feedback_incentive_records.order(created_at: :desc).first
    last_record ? last_record.current_balance : 0
  end


  def incentive_due_date
    first_record = feedback_incentive_records.order(created_at: :asc).first
    return if first_record.blank?
    first_record.created_at  + FeedbackIncentiveRecord::PAYMENT_WAITING_PERIOD
  end

  def network_user
    NetworkApi::User.find(uid).first
  end

  def generate_network_auth_token
    return unless limited?
    nu = network_user
    return unless nu.present?
    nu.generate_auth_token.first.try(:authentication_token)
  rescue JsonApiClient::Errors::NotAuthorized
    # shouldn't happen since we are already escaping `unless limited?`
    nil
  end

  private

  def email_required?
    !limited?
  end

  def change_network_admin(action, org_id)
    # must have uid for network request
    return true unless uid

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

  # gets called via background worker
  def update_mailing_list_subscription
    MailchimpSubscriptionWorker.perform_async(id, mailing_list)
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
