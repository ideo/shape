class RemoveGrandparentToChildGroupRelations
  include Interactor
  include Interactor::Schema

  schema :parent_group, :subgroup
  delegate :parent_group, :subgroup, to: :context

  def call
    remove_child_memberships
  end

  private

  def remove_child_memberships
    # We want to no-op here instead of context.fail!
    return if subgroup.parent_groups.empty?

    p ancestors_groups = collect_ancestors(group, [])

    ancestors_groups.each do |ancestor_groups|
      subgroup.subgroups.each do |child_group|
        GroupHierarchy.
          where(
            parent_group: ancestor_group,
            granted_by: subgroup,
            subgroup: child_group,
          ).destroy_all
      end
    end

  end
  # given list of parents
  # find all ancestors of each parent
  #
  # repeat
  def collect_ancestors(group, result = [])
    return result.flatten.compact.uniq if group.parent_groups.empty?

    group.parent_groups.map do |parent_group|
      collect_ancestors(parent_group, parent_group.parent_groups)
    end
  end
end

# Break links between ancestors of parent group and children of subgroup




# collection = []
# starting group [a]
# collection = [a]
# second level of ancestors [b, c]
# collection = [a, [b, c]]
# third level of ancestors [[d], [e]]
# collection = [a, [b, c], [[d], [e]]]
# fourth level of ancestors [f]
# collection = [a, [b, c], [[d], [e]], [f]]
