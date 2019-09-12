class GrantGrandparentsAccessToSubgroup
  include Interactor::Organizer
  include Interactor::Schema

  schema :subgroup, :parent_group
  delegate :parent_group, :subgroup, to: :context

  def call
    relate_grandparents_to_subgroup
  end

  private

  def relate_grandparents_to_subgroup
    grandparents = GroupHierarchy.where(subgroup_id: parent_group.id).map(&:parent_group)
    # We want to no-op here instead of context.fail!
    return if grandparents.empty?

    grandparents.each do |grandparent|
      GroupHierarchy.create(
        parent_group: grandparent,
        granted_by: parent_group,
        subgroup: subgroup,
      )
    end

    context.fail!(message: error_message) unless grandparents.any? do |grandparent|
      !grandparent.subgroups.include?(subgroup)
    end
  end

  def error_message
    'Failed to relate some grandparent(s) to subgroup'
  end
end
