class GrantParentAccessToSubgroup
  include Interactor::Organizer
  include Interactor::Schema

  schema :subgroup, :parent_group
  delegate :parent_group, :subgroup, to: :context

  def call
    create_group_hierarchy
  end

  private

  def create_group_hierarchy
    relation = GroupHierarchy.create(
      parent_group: context.parent_group,
      granted_by: context.parent_group,
      subgroup: context.subgroup,
    )

    context.fail!(message: relation.errors.full_messages.join(', ')) unless relation.persisted?
  end
end
