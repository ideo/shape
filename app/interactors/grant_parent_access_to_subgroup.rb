class GrantParentAccessToSubgroup
  include Interactor

  require_in_context :subgroup, :parent_group
  delegate :parent_group, :subgroup, to: :context

  def call
    create_group_hierarchy
  end

  private

  def create_group_hierarchy
    context.new_hierarchy = GroupHierarchy.create(
      parent_group: context.parent_group,
      path: [context.parent_group, context.subgroup].map(&:id),
      subgroup: context.subgroup,
    )

    return context if context.new_hierarchy.persisted?

    context.fail!(message: context.new_hierarchy.errors.full_messages.join(', '))
  end
end
