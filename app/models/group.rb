class Group < ApplicationRecord
  include Resourceable
  include HasFilestackFile
  # Admins can manage people in the group
  # Members have read access to everything the group is linked to
  resourceable roles: [Role::ADMIN, Role::MEMBER],
               edit_role: Role::ADMIN,
               view_role: Role::MEMBER

  belongs_to :organization

  before_validation :set_handle_if_none, on: :create

  validates :name, presence: true

  validates :handle,
            uniqueness: { scope: :organization_id },
            if: :validate_handle?

  validates :handle,
            format: { with: /[a-zA-Z0-9\-\_]+/ },
            if: :validate_handle?

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

  def validate_handle?
    new_record? || handle_changed?
  end

  def set_handle_if_none
    self.handle ||= name.parameterize
  end
end
