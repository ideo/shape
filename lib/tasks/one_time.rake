namespace :one_time do
  desc 'Migrate from GroupHierarchy to use Group#subgroup_ids'
  task group_hierarchies_to_subgroup_ids_migration: :environment do
    Searchkick.callbacks(false) do
      GroupHierarchy
      .group(:parent_group_id, :subgroup_id)
      .pluck(:parent_group_id, :subgroup_id).each do |arr|
        parent_group = Group.find_by(id: arr[0])
        subgroup = Group.find_by(id: arr[1])
        next if parent_group.blank? || subgroup.blank?

        parent_group.add_subgroup(subgroup)
      end
    end
    Group.reindex
  end
end
