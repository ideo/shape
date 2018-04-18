namespace :group_shared_collections do
  task import: :environment do
    unless group.is_primary?
      shared = Collection::SharedWithMeCollection.create_for_group(
        group, group.organization
      )
      group.update(current_shared_collection: shared)
    end
  end
end
