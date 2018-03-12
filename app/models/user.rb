class User < ApplicationRecord
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

  validates :uid, :provider, :email, presence: true

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

  def current_user_collection_id
    current_user_collection.try(:id)
  end

  def current_user_collection
    return nil if current_organization.blank?

    collections.user.find_by_organization_id(current_organization_id)
  end

  private

  def after_add_role(role)
    if role.resource.is_a?(Group)
      organization = role.resource.organization
      organization.user_role_added(self)
    end
  end

  def after_remove_role(role)
    if role.resource.is_a?(Group)
      organization = role.resource.organization
      organization.user_role_removed(self)
    end
  end
end
