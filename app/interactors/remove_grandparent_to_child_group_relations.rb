class RemoveGrandparentToChildGroupRelations
  include Interactor
  include Interactor::Schema

  schema :parent_group, :subgroup
  delegate :parent_group, :subgroup, to: :context

  def call
    remove_related_paths
  end

  private

  def remove_related_paths
    GroupHierarchy.where(
      'path @> ?', [parent_group.id, subgroup.id].to_s
    ).destroy_all
  end
end
