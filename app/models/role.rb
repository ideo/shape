class Role < ApplicationRecord
  has_many :users_roles, dependent: :destroy
  has_many :users, through: :users_roles

  has_many :groups_roles, dependent: :destroy
  has_many :groups, through: :groups_roles

  belongs_to :resource,
             polymorphic: true,
             optional: true

  before_save :set_resource_identifier
  after_commit :update_resource_collection_card

  validates :resource_type,
            inclusion: { in: Rolify.resource_types },
            allow_nil: true

  scopify

  VIEWER = :viewer
  EDITOR = :editor
  CONTENT_EDITOR = :content_editor
  MEMBER = :member
  ADMIN = :admin
  SUPER_ADMIN = :super_admin
  APPLICATION_USER = :application_user

  amoeba do
    enable
    include_association :users_roles
    include_association :groups_roles
  end

  def self.for_resource(object)
    where(resource_identifier: object_identifier(object))
  end

  def self.find_or_create(role_name, resource = nil)
    return Role.find_or_create_by(name: role_name, resource: nil) if resource.blank?

    Role.find_or_create_by(
      name: role_name,
      resource_type: resource.class.base_class.name,
      resource_id: resource.id,
    )
  end

  # All the resources of a specific type (e.g. Organization) that this user is connected to
  # Role name is optional but can additionally scope it
  def self.user_resources(user:, resource_type:, role_name: nil)
    roles = joins(:users_roles)
            .where(UsersRole.arel_table[:user_id].eq(user.id))
            .where(resource_type: resource_type)
            .includes(:resource)

    roles = roles.where(name: role_name) if role_name.present?

    roles.map(&:resource).compact
  end

  def self.object_identifier(object)
    [object.class.base_class.to_s, object.id].select(&:present?).join('_')
  end

  def self.identifier(role_name:, resource_identifier: nil, user_id: nil, group_id: nil)
    identifier = [role_name]

    if [resource_identifier, user_id, group_id].select(&:present?).size > 1
      raise 'role_identifier can accept only resource_identifier, user_id OR group_id'
    end

    if resource_identifier.present?
      identifier << resource_identifier
    elsif user_id.present?
      identifier << object_identifier(User.new(id: user_id))
    elsif group_id.present?
      identifier << object_identifier(Group.new(id: group_id))
    end

    identifier.select(&:present?).join('_')
  end

  def label
    return name unless name.to_sym == VIEWER && resource.is_a?(Collection::SubmissionBox)
    'participant'
  end

  def duplicate!(assign_resource: nil, dont_save: false)
    r = amoeba_dup
    r.resource = assign_resource if assign_resource.present?
    r.save unless dont_save
    r
  end

  def resource_identifier
    "#{resource_type}_#{resource_id}"
  end

  def identifier
    [name, resource_identifier].select(&:present?).join('_')
  end

  # includes users with this role and group->users with this role
  def all_user_ids
    (user_ids + groups.map(&:user_id)).flatten.uniq
  end

  def user_identifiers
    ids = persisted? ? user_ids : users_roles.map(&:user_id)
    ids.map do |user_id|
      Role.identifier(role_name: name, user_id: user_id)
    end
  end

  def group_identifiers
    ids = persisted? ? group_ids : groups_roles.map(&:group_id)
    ids.map do |group_id|
      Role.identifier(role_name: name, group_id: group_id)
    end
  end

  private

  def set_resource_identifier
    self.resource_identifier = resource_identifier
  end

  # necessary for busting collection cache e.g. when you update a role of a sub-collection
  def update_resource_collection_card
    return unless resource.present?
    card = resource.try(:parent_collection_card)
    return unless card.present?
    card.touch
  end
end
