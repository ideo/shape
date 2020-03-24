class GrantParentAccessToSubgroup
  include Interactor

  require_in_context :subgroup, :parent_group
  delegate :parent_group, :subgroup, to: :context

  def call
    create_group_hierarchy
  end

  private

  def create_group_hierarchy
    context.new_hierarchy = GroupHierarchy.find_or_create_path(
      parent_group_id: context.parent_group.id,
      path: [context.parent_group, context.subgroup].map(&:id),
      subgroup_id: context.subgroup.id,
    )

    return context if context.new_hierarchy.persisted?

    context.fail!(message: context.new_hierarchy.errors.full_messages.join(', '))
  end
end
