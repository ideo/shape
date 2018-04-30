class Organization < ApplicationRecord
  include HasFilestackFile

  has_many :collections, -> { root }
  has_many :groups, dependent: :destroy
  belongs_to :primary_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true
  belongs_to :guest_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true

  after_create :create_groups
  after_update :update_group_names, if: :saved_change_to_name?

  delegate :admins, to: :primary_group
  delegate :members, to: :primary_group
  delegate :handle, to: :primary_group
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

  def matches_domain_whitelist?(user)
    email_domain = user.email.split('@').last
    domain_whitelist.include? email_domain
  end

  # doublecheck happens when you finally sign in, at which point your email may have updated based on your network profile.
  # at that point, we don't need to "revoke" primary (e.g. you were invited whitelisted, but signed in with personal)
  # but we do want to switch you to the org if you switched to your whitelisted domain email
  def add_new_user(user, doublecheck: false)
    if matches_domain_whitelist?(user)
      # add them as an org member
      user.remove_role(Role::MEMBER, guest_group) # remove if exists
      user.add_role(Role::MEMBER, primary_group)
    elsif !doublecheck
      # or else as a guest member if their domain doesn't match
      user.add_role(Role::MEMBER, guest_group)
    end
  end

  def guest_group_name
    "#{name} Guests"
  end

  def guest_group_handle
    "#{handle}-guest"
  end

  private

  def create_groups
    create_primary_group(name: name, organization: self)
    create_guest_group(name: guest_group_name, organization: self, handle: guest_group_handle)
    save # Save primary group attr
  end

  def update_group_names
    primary_group.update_attributes(name: name)
    guest_group.update_attributes(name: guest_group_name, handle: guest_group_handle)
  end
end
