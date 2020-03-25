namespace :one_time do
  desc 'Migrate from GroupHierarchy to use Group#subgroup_ids'
  task group_hierarchies_to_subgroup_ids_migration: :environment do
    Searchkick.callbacks(false) do
      GroupHierarchy.includes(:parent_group, :subgroup).all.find_each do |group_hierarchy|
        group_hierarchy.parent_group.add_subgroup(
          group_hierarchy.subgroup,
        )
      end
    end
    Group.reindex
  end
end
