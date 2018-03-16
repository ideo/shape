class Group < ApplicationRecord
  include Resourceable
  # Admins can manage people in the group
  # Members have read access to everything the group is linked to
  resourceable roles: %i[admin member]
  belongs_to :organization

  before_validation :set_tag_if_none, on: :create

  validates :name, presence: true
  validates :tag, uniqueness: { scope: :organization_id }
  validate :tag_formatted_correctly # Tried to use format validation but it didn't work

  def admins_and_members
    User.joins(:roles)
        .where(Role.arel_table[:name].in([Role::ADMIN, Role::MEMBER]))
        .where(Role.arel_table[:resource_type].in(self.class.name))
        .where(Role.arel_table[:resource_id].in(id))
  end

  def admin_and_member_ids
    admins_and_members.pluck(:id)
  end

  def primary?
    organization.primary_group_id == id
  end

  private

  def set_tag_if_none
    self.tag ||= name.underscore
  end

  def tag_formatted_correctly
    return unless tag.match(/[a-zA-Z0-9\-\_]*/).present?
    errors.add(:tag, 'must be letters, numbers, -, and _ characters')
  end
end
