namespace :old_test_collections do
  desc 'Migrate TestCollection/TestDesign setup to TestResultsCollection'
  task migrate: :environment do
    puts "migrating #{Collection::TestDesign.count} TestDesigns..."
    Collection::TestDesign.find_each(&:migrate!)
    # now this next step will include the migrated ones above...
    puts "migrating #{Collection::TestCollection.draft.count} draft TestCollections..."
    Collection::TestCollection.find_each(&:migrate!)
  end
end
