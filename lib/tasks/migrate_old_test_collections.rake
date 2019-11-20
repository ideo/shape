namespace :old_test_collections do
  desc 'Migrate TestCollection/TestDesign setup to TestResultsCollection'
  task migrate: :environment do
    puts "migrating #{Collection::TestDesign.count} TestDesigns..."
    puts '***'
    Collection::TestDesign.find_each do |td|
      puts "migrating #{td.name}; #{td.id} -- #{Time.current}"
      begin
        td.migrate!
      rescue StandardError => e
        puts "<<error!>> #{e.full_message}"
      end
    end
    puts "migrating #{Collection::TestCollection.draft.count} draft TestCollections..."
    puts '***'
    Collection::TestCollection.draft.find_each do |tc|
      puts "migrating #{tc.name}; #{tc.id} -- #{Time.current}"
      begin
        tc.migrate!
      rescue StandardError => e
        puts "<<error!>> #{e.full_message}"
      end
    end
  end
end
