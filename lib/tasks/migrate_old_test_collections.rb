namespace :old_test_collections do
  desc 'Migrate TestCollection/TestDesign setup to TestResultsCollection'
  task migrate: :environment do
    Collection::TestDesign.find_each(&:migrate!)
  end
end
