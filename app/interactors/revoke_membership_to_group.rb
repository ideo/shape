class RevokeMembershipToGroup
  include Interactor::Organizer
  include Interactor::Schema

  schema :subgroup, :parent_group
  delegate :subgroup, :parent_group, to: :context

  def call
    revoke_membership
  end

  private

  def revoke_membership
    association = GroupHierarchy.where(
      subgroup: subgroup,
      parent_group: parent_group,
      granted_by: parent_group,
    ).first
    context.fail!(message: error_message) if association.blank?
    association.destroy
  end

  def error_message
    'No group membership found to revoke'
  end
end
