class GrantParentAccessToChildrenOfSubgroup
  include Interactor::Organizer
  include Interactor::Schema

  schema :subgroup, :parent_group, :adopted_children
  delegate :parent_group, :subgroup, to: :context

  def call
    relate_parent_to_children_of_subgroup
  end

  private

  def relate_parent_to_children_of_subgroup
    # We want to no-op here instead of context.fail!
    return if subgroup.subgroups.empty?

    subgroup.subgroups.map do |child_group|
      GroupHierarchy.create!(
        parent_group: parent_group,
        granted_by: subgroup,
        subgroup: child_group,
      )
    end
    context.fail!(
      message: 'Failed to relate parent to children of subgroup',
    ) if parent_group.subgroups.empty?
  end
end
