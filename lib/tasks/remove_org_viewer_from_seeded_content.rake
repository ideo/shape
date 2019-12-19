namespace :seeded_content do
  desc 'Migrate TestCollection/TestDesign setup to TestResultsCollection'
  task remove_org_viewer: :environment do
    Organization.find_each do |org|
      remove_org_viewer(org)
    end
  end
end

def remove_org_viewer(org)
  gs = org.getting_started_collection
  # inner_count = gs.all_child_collections.count
  puts "*** #{org.name} ***"
  gs.recursively_fix_breadcrumbs!

  primary_group = org.primary_group
  all_collections = [gs] + gs.all_child_collections
  puts "inspecting #{all_collections.count} getting started collections"
  all_collections.each do |c|
    clones_with_roles = Collection.where(cloned_from: c, roles_anchor_collection_id: nil)
    count = clones_with_roles.count
    next unless count.positive?

    puts "removing org access from clones of #{c.name} (#{count} total)"
    clones_with_roles.find_in_batches.each_with_index do |batch, i|
      puts "fixing batch #{i} (#{batch.count})..."
      batch.each do |clone|
        primary_group.remove_role(Role::VIEWER, clone)
      end
      Collection.search_import.where(id: batch.pluck(:id)).reindex
    end
  end
end
