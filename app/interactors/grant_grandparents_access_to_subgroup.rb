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

    grandparents.each do |grandparent|
      GroupHierarchy.create(
          parent_group: grandparent,
          granted_by: parent_group,
          subgroup: subgroup,
        )
    end

    context.fail!(
      message: 'Failed to relate some grandparent(s) to subgroup',
    ) if grandparents.any? { |grandparent| !grandparent.subgroups.include?(subgroup) }
  end
end
