class User < ApplicationRecord
  rolify after_add: :after_add_role
  devise :database_authenticatable, :registerable, :trackable,
         :rememberable, :validatable, :omniauthable,
         omniauth_providers: [:okta]

  has_many :users_roles, dependent: :destroy
  has_many :organizations,
           through: :roles,
           source: :resource,
           source_type: 'Organization'
  belongs_to :current_organization,
             class_name: 'Organization',
             optional: true

  after_commit :add_to_default_org_group, on: :create

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

  def organizations_with_role(role)
    Organization.with_role(role, self)
  end

  private

  def after_add_role(role)
    if role.resource.is_a?(Organization) && current_organization_id.blank?
      # Set this as the user's current organization if they don't have one
      update_attributes(current_organization: role.resource)
    end
  end

  def add_to_default_org_group
    org = Organization.first
    add_role(:member, org.primary_group) if org.present?
  end
end
