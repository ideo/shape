class Organization < ApplicationRecord
  include HasFilestackFile

  has_many :collections, -> { root }
  has_many :groups, dependent: :destroy
  belongs_to :primary_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true

  after_create :create_primary_group
  after_save :update_primary_group_name, on: :update, if: :saved_change_to_name?

  delegate :admins, to: :primary_group
  delegate :members, to: :primary_group
  delegate :can_edit?, to: :primary_group
  delegate :can_view?, to: :primary_group

  validates :name, presence: true

  def self.create_for_user(user)
    o = Organization.new
    o.name = [user.first_name, user.last_name, 'Organization'].compact.join(' ')
    if o.save
      user.add_role(Role::ADMIN, o.primary_group)
    end
    o
  end

  # Note: this method can be called many times for the same org
  def user_role_added(user)
    Collection::UserCollection.find_or_create_for_user(user, self)

    # Set this as the user's current organization if they don't have one
    user.switch_to_organization(self) if user.current_organization_id.blank?
  end

  # Note: this method can be called many times for the same org
  def user_role_removed(user)
    # If they are still an admin or member, don't do anything
    return if can_view?(user)

    # Set current org as one they are a member of
    # If nil, that is fine as they shouldn't have a current organization
    user.switch_to_organization(user.organizations.first)
  end

  private

  def create_primary_group
    build_primary_group(name: name, organization: self).save
    save # Save primary group attr
  end

  def update_primary_group_name
    primary_group.update_attributes(name: name)
  end
end
