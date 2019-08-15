class CalculateOrganizationActiveUsers
  include Interactor
  require_in_context :organization
  delegate_to_context :organization

  def call
    # record this before the number gets re-calculated on the org
    context.active_users_initial_count = organization.active_users_count
    update_active_users_count
  end

  def rollback
    organization.update_attributes(active_users_count: context.active_users_initial_count)
  end

  private

  def calculate_active_users_count
    # We only want to count activity users have done within this particular org
    # e.g. a user may have logged in recently and been "active" but in a different org
    User
      .active
      .where(User.arel_table[:email].not_eq(Organization::SUPER_ADMIN_EMAIL))
      .where("last_active_at->>'#{organization.id}' > ?", Organization::RECENTLY_ACTIVE_RANGE.ago)
      .count
  end

  def update_active_users_count
    # this will update the org in our context
    organization.update_attributes(active_users_count: calculate_active_users_count)
  end
end
