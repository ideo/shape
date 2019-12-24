namespace :seeded_content do
  desc 'Migrate TestCollection/TestDesign setup to TestResultsCollection'
  task reindex: :environment do
    Organization.find_each do |org|
      reindex_getting_started_clones(org)
    end
  end
end

def reindex_getting_started_clones(org)
  gs = org.getting_started_collection
  return false unless gs.present?

  puts "\n*** #{org.name} ***"
  all_collections = [gs] + gs.all_child_collections
  puts "> Inspecting #{all_collections.count} getting started collections"
  all_collections.each do |c|
    clones = Collection.where(cloned_from: c)
    count = clones.count
    next unless count.positive?

    puts "Reindexing clones of #{c.name} (#{count} total)"
    agg = 0
    Collection.search_import.where(cloned_from: c).find_in_batches.with_index do |batch, i|
      agg += batch.count
      puts "Reindexing batch #{i}... #{agg}/#{count}"
      batch.each do |record|
        Collection.searchkick_index.remove(record)
      end
    end
  end
end
