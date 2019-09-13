class RemoveChildrenOfSubgroup
  include Interactor
  include Interactor::Schema

  schema :parent_group, :subgroup
  delegate :parent_group, :subgroup, to: :context

  def call
    remove_children_of_subgroup
  end

  private

  def remove_children_of_subgroup
    # We want to no-op here instead of context.fail!
    return if subgroup.subgroups.empty?

    GroupHierarchy
      .where(
        parent_group: subgroup,
        granted_by: subgroup,
      ).destroy_all
  end
end
