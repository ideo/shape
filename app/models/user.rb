class User < ApplicationRecord
  rolify after_add: :after_add_role,
         after_remove: :after_remove_role

  devise :database_authenticatable, :registerable, :trackable,
         :rememberable, :validatable, :omniauthable,
         omniauth_providers: [:okta]

  has_many :users_roles, dependent: :destroy
  has_many :groups,
           through: :roles,
           source: :resource,
           source_type: 'Group'
  has_many :organizations, through: :groups
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

  private

  def after_add_role(role)
    if role.resource.is_a?(Group) && current_organization_id.blank?
      # Set this as the user's current organization if they don't have one
      update_attributes(current_organization: role.resource.organization)
    end
  end

  def after_remove_role(role)
    if role.resource.is_a?(Group)
      other_org = organizations.first
      # Set current org as one they are a member of
      # If nil, that is fine as they shouldn't have a current organization
      update_attributes(current_organization: other_org)
    end
  end
end
