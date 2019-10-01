class GrantParentAccessToChildrenOfSubgroup
  include Interactor

  require_in_context :subgroup, :parent_group, :new_hierarchy
  delegate_to_context :parent_group, :subgroup, :new_hierarchy

  def call
    relate_parent_to_children_of_subgroup
  end

  private

  def relate_parent_to_children_of_subgroup
    links_to_descendants = GroupHierarchy.where(parent_group_id: subgroup.id)
    links_to_ancestors = GroupHierarchy.where(subgroup_id: parent_group.id)

    links_to_ancestors.each do |ancestor|
      ancestor.extend_path_to(subgroup)

      links_to_descendants.each do |descendant|
        ancestor.extend_path_to(descendant)
      end
    end

    links_to_descendants.each do |descendant|
      new_hierarchy.extend_path_to(descendant)
    end

    context.fail!(message: 'Failed to relate parent to children of subgroup') if parent_group.subgroups.empty?
  end
end
