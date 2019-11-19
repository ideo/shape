namespace :old_test_collections do
  desc 'Migrate TestCollection/TestDesign setup to TestResultsCollection'
  task migrate: :environment do
    puts "migrating #{Collection::TestDesign.count} TestDesigns..."
    Collection::TestDesign.find_each(&:migrate!)
    puts "migrating #{Collection::TestCollection.draft.count} draft TestCollections..."
    Collection::TestCollection.draft.find_each(&:migrate!)
  end
end
