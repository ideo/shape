class Organization < ApplicationRecord
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
  delegate :admins_and_members, to: :primary_group
  delegate :admin_and_member_ids, to: :primary_group

  validates :name, presence: true

  # Note: this method can be called many times for the same org
  def user_role_added(user)
    if user.current_organization_id.blank?
      # Set this as the user's current organization if they don't have one
      user.update_attributes(current_organization: self)
    end

    # Create the user's workspace collection for this org
    # if they don't already have one
    return if collections.user.where(organization_id: id).count.positive?

    Collection::UserCollection.create_for_user(user, self)
  end

  # Note: this method can be called many times for the same org
  def user_role_removed(user)
    # If they are still an admin or member, don't do anything
    return if admin_and_member_ids.include?(user.id)

    # Set current org as one they are a member of
    # If nil, that is fine as they shouldn't have a current organization
    other_org = user.organizations.first
    user.update_attributes(current_organization: other_org)
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
