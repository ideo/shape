class User < ApplicationRecord
  include CacheableRoles

  rolify after_add: :after_add_role,
         after_remove: :after_remove_role,
         strict: true

  devise :database_authenticatable, :registerable, :trackable,
         :rememberable, :validatable, :omniauthable,
         omniauth_providers: [:okta]

  has_many :collections,
           through: :roles,
           source: :resource,
           source_type: 'Collection'
  has_many :groups,
           through: :roles,
           source: :resource,
           source_type: 'Group'
  has_many :organizations, through: :groups
  has_many :users_roles
  belongs_to :current_organization,
             class_name: 'Organization',
             optional: true

  validates :email, presence: true
  validates :uid, :provider, presence: true, if: :active?

  alias rolify_has_role? has_role?
  alias rolify_add_role add_role
  alias rolify_remove_role remove_role

  searchkick word_start: [:name]

  scope :search_import, -> { includes(:roles) }

  enum status: {
    active: 0,
    pending: 1,
    deleted: 2,
  }

  def search_data
    {
      name: name,
      email: email,
      organization_ids: organizations.map(&:id),
    }
  end

  def self.from_omniauth(auth)
    user = where(provider: auth.provider, uid: auth.uid).first

    unless user
      user = User.new
      user.password = Devise.friendly_token[0,40]
      user.password_confirmation = user.password
      user.provider = auth.provider
      user.uid = auth.uid
    end

    # Update user on every auth
    user.email = auth.info.email
    user.first_name = auth.info.first_name
    user.last_name = auth.info.last_name
    user.pic_url_square = auth.info.image

    user
  end

  def self.create_pending_user(email:)
    create(
      email: email,
      status: User.statuses[:pending],
      password: Devise.friendly_token,
    )
  end

  def name
    [first_name, last_name].compact.join(' ')
  end

  def current_user_collection_id
    current_user_collection.try(:id)
  end

  def current_user_collection
    return nil if current_organization.blank?

    collections.user.find_by_organization_id(current_organization_id)
  end

  # Override rolify has_role? and add_role methods to ensure
  # we always pass root class, not STI child class - which it can't handle
  def has_role?(role_name, resource = nil)
    return rolify_has_role?(role_name) if resource.blank?
    rolify_has_role?(role_name, resource.becomes(resource.resourceable_class))
  end

  def add_role(role_name, resource = nil)
    return rolify_add_role(role_name) if resource.blank?
    rolify_add_role(role_name, resource.becomes(resource.resourceable_class))
  end

  def remove_role(role_name, resource = nil)
    return rolify_remove_role(role_name) if resource.blank?
    rolify_remove_role(role_name, resource.becomes(resource.resourceable_class))
  end

  private

  def after_add_role(role)
    reset_cached_roles!

    resource = role.resource
    if resource.is_a?(Group)
      organization = resource.organization
      organization.user_role_added(self)
    end

    # Reindex record if it is a searchkick model
    resource.reindex if resource.respond_to?(:queryable) && queryable
  end

  def after_remove_role(role)
    reset_cached_roles!

    resource = role.resource
    if resource.is_a?(Group)
      organization = resource.organization
      organization.user_role_removed(self)
    end

    # Reindex record if it is a searchkick model
    resource.reindex if resource.respond_to?(:queryable) && queryable
  end
end
