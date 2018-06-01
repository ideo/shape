class User < ApplicationRecord
  prepend RolifyExtensions # Prepend so it can call rolify methods using super

  rolify after_add: :after_role_update,
         after_remove: :after_role_update,
         strict: true

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

  has_many :organizations, -> { distinct }, through: :groups
  has_many :users_roles
  belongs_to :current_organization,
             class_name: 'Organization',
             optional: true
  belongs_to :current_user_collection,
             class_name: 'Collection',
             optional: true

  validates :email, presence: true
  validates :uid, :provider, presence: true, if: :active?
  validates :uid, uniqueness: { scope: :provider }, if: :active?

  searchkick callbacks: :async, word_start: [:name]

  scope :search_import, -> { includes(:roles) }

  attribute :pic_url_square,
            :string,
            default: 'https://d3none3dlnlrde.cloudfront.net/assets/users/avatars/missing/square.jpg'

  enum status: {
    active: 0,
    pending: 1,
    deleted: 2,
  }

  # to turn off devise validatable for uniqueness of email
  def will_save_change_to_email?
    false
  end

  def search_data
    {
      name: name,
      email: email,
      organization_ids: organizations.map(&:id),
    }
  end

  def self.all_active_except(user_id)
    active.where.not(id: user_id).order(first_name: :asc)
  end

  def self.from_omniauth(auth, pending_user)
    user = where(provider: auth.provider, uid: auth.uid).first

    unless user
      user = pending_user || User.new
      user.status = User.statuses[:active]
      user.invitation_token = nil
      user.password = Devise.friendly_token(40)
      user.password_confirmation = user.password
      user.provider = auth.provider
      user.uid = auth.uid
    end

    # Update user on every auth
    user.email = auth.info.email
    user.first_name = auth.info.first_name
    user.last_name = auth.info.last_name
    user.pic_url_square = auth.info.picture

    user
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
      id: id,
      name: name,
      pic_url_square: pic_url_square,
    }
  end

  def update_from_network_profile(params)
    self.first_name = params[:first_name] if params[:first_name].present?
    self.last_name = params[:last_name] if params[:last_name].present?
    self.email = params[:email] if params[:email].present?
    self.pic_url_square = params[:picture] if params[:picture].present?
    save
  end

  def name
    [first_name, last_name].compact.join(' ')
  end

  def switch_to_organization(organization = nil)
    if organization.blank?
      self.current_organization = self.current_user_collection = nil
    else
      self.current_organization = organization
      self.current_user_collection = collections.user.find_by_organization_id(organization.id)
    end
    # make sure user picks up new roles / relationships
    save && reload
  end

  # overrides retrieval of belongs_to relation
  def current_user_collection(org_id = current_organization_id)
    return nil unless org_id
    if current_user_collection_id && org_id == current_organization_id
      # if within same org, we already have the current_user_collection id
      return Collection.find(current_user_collection_id)
    end
    # TODO: rename "user" to user_collection
    collections.user.find_by_organization_id(org_id)
  end

  def current_shared_collection(org_id = current_organization_id)
    return nil unless current_organization_id
    collections.shared_with_me.find_by_organization_id(org_id)
  end

  def organization_group_ids(organization)
    groups.where(organization_id: organization.id).pluck(:id)
  end

  def current_org_groups_roles_identifiers
    return [] if current_organization.blank?

    org_group_ids = organization_group_ids(current_organization).uniq

    return [] if org_group_ids.blank?

    Role.joins(:groups_roles)
        .where(GroupsRole.arel_table[:group_id].in(org_group_ids))
        .map(&:identifier)
  end

  def current_org_groups_and_special_groups
    groups = current_org_groups.to_a
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

  private

  def after_role_update(role)
    reset_cached_roles!
    # Reindex record if it is a searchkick model
    resource = role.resource
    resource.reindex if Searchkick.callbacks? && resource.searchable?
  end
end
