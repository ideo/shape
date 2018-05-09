class Organization < ApplicationRecord
  has_many :collections, dependent: :destroy
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
  before_update :parse_domain_whitelist
  after_update :update_group_names, if: :saved_change_to_name?
  after_update :check_guests_for_domain_match, if: :saved_change_to_domain_whitelist?

  delegate :admins, to: :primary_group
  delegate :members, to: :primary_group
  delegate :handle, to: :primary_group

  validates :name, presence: true

  def can_view?(user)
    primary_group.can_view?(user) or guest_group.can_view?(user)
  end

  def can_edit?(user)
    primary_group.can_edit?(user) or guest_group.can_edit?(user)
  end

  def self.create_for_user(user)
    name = [user.first_name, user.last_name, 'Organization'].compact.join(' ')
    builder = OrganizationBuilder.new({ name: name }, user)
    builder.save
    builder.organization
  end

  # Note: this method can be called many times for the same org
  def setup_user_membership_and_collections(user)
    # make sure they're on the org
    setup_user_membership(user)
    Collection::UserCollection.find_or_create_for_user(user, self)
  end

  def remove_user_membership(user)
    Roles::RemoveFromOrganization.new(self, user).call

    if user.organizations.count.zero?
      self.create_for_user(user)
    end

    # Set current org as one they are a member of
    # If nil, that is fine as they shouldn't have a current organization
    user.switch_to_organization(user.organizations.first)
  end

  def matches_domain_whitelist?(user)
    email_domain = user.email.split('@').last
    domain_whitelist.include? email_domain
  end

  def setup_user_membership(user)
    if matches_domain_whitelist?(user)
      # add them as an org member
      user.add_role(Role::MEMBER, primary_group)
      # remove guest role if exists, do this second so that you don't temporarily lose org membership
      user.remove_role(Role::MEMBER, guest_group)
    elsif !primary_group.can_view?(user)
      # or else as a guest member if their domain doesn't match,
      # however if they've already been setup as an org member then they don't get "demoted"
      user.add_role(Role::MEMBER, guest_group)
    end
    # Set this as the user's current organization if they don't have one
    user.switch_to_organization(self) if user.current_organization_id.blank?
  end

  def guest_group_name
    "#{name} Guests"
  end

  def guest_group_handle
    "#{handle}-guest"
  end

  private

  def parse_domain_whitelist
    return true unless will_save_change_to_domain_whitelist?
    if domain_whitelist.is_a?(String)
      # when saving from the frontend/API we just pass in a string list of domains,
      # so we split to save as an array
      self.domain_whitelist = domain_whitelist.split(',').map(&:strip)
    end
    domain_whitelist
  end

  def check_guests_for_domain_match
    guest_group.members[:users].each do |user|
      setup_user_membership(user)
    end
  end

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
