class User < ApplicationRecord
  prepend RolifyExtensions # Prepend so it can call rolify methods using super

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
           -> { active },
           through: :roles,
           source: :resource,
           source_type: 'Group'
  has_many :organizations, through: :groups
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
    user.pic_url_square = auth.info.image

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
    save
  end

  def current_user_collection_id
    current_user_collection.try(:id)
  end

  def current_user_collection
    return nil if current_organization.blank?

    # TODO: rename "user" to user_collection
    collections.user.find_by_organization_id(current_organization_id)
  end

  def current_shared_collection
    return nil if current_organization.blank?

    collections.shared_with_me.find_by_organization_id(current_organization_id)
  end

  def current_org_groups
    return [] if current_organization.blank?

    groups.where(organization_id: current_organization_id)
  end

  def viewable_collections_and_items(organization)
    Role.user_resources(
      user: self,
      resource_type: %i[Collection Item],
    ).select do |resource|
      if resource.archived?
        false
      elsif resource.respond_to?(:organization_id)
        resource.organization_id == organization.id
      else
        # TODO: this is potentially including items from other orgs
        # For now, most people will belong only to one org, so leaving it in.
        true
      end
    end
  end

  def collection_and_group_identifiers(organization)
    # Always include primary group
    identifiers = [organization.primary_group.resource_identifier]

    # Get all content user can see, in this org
    identifiers |= viewable_collections_and_items(organization)
                   .map(&:resource_identifier)

    # All groups user is a member of in this org
    identifiers | groups.where(organization_id: organization.id)
                        .map(&:resource_identifier)
  end

  def users_through_collections_items_and_groups(organization)
    identifiers = collection_and_group_identifiers(organization)

    User.distinct(User.arel_table[:id])
        .joins(:roles)
        .where(Role.arel_table[:resource_identifier].in(identifiers))
        .where.not(id: id)
        .order(first_name: :asc)
        .to_a
  end

  def organization_group_ids(organization)
    groups.where(organization_id: organization.id).pluck(:id)
  end

  def current_org_groups_roles_identifiers
    return [] if current_organization.blank?

    org_group_ids = organization_group_ids(current_organization).uniq

    return [] if org_group_ids.blank?

    Role
        .joins(:groups_roles)
        .where(GroupsRole.arel_table[:group_id].in(org_group_ids))
        .reject{ |role|
          role.groups.first.current_shared_collection.try(:id) == role.resource.id
        }
        .map(&:identifier)
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
    if Searchkick.callbacks? && resource.respond_to?(:queryable) && queryable
      resource.reindex
    end
  end

  def after_remove_role(role)
    reset_cached_roles!

    resource = role.resource
    if resource.is_a?(Group)
      organization = resource.organization
      organization.user_role_removed(self)
    end

    # Reindex record if it is a searchkick model
    if Searchkick.callbacks? && resource.respond_to?(:queryable) && queryable
      resource.reindex
    end
  end
end
