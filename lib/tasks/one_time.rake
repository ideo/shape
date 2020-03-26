namespace :one_time do
  desc 'Migrate from GroupHierarchy to use Group#subgroup_ids'
  task group_hierarchies_to_subgroup_ids_migration: :environment do
    Searchkick.callbacks(false) do
      GroupHierarchy
      .group(:parent_group_id, :subgroup_id)
      .pluck(:parent_group_id, :subgroup_id).each do |arr|
        parent_group = Group.find(arr[0])
        subgroup = Group.find(arr[1])
        parent_group.add_subgroup(
          subgroup,
        )
      end
    end
    Group.reindex
  end
end
