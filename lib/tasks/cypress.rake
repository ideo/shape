namespace :cypress do
  desc 'set up the test env for cypress E2E testing'
  task db_setup: :environment do
    # Collection 1 is DK Test's "My Collection"
    my_collection = Collection.find 1
    # via dependent: :destroy this will also remove everything in the test area
    my_collection.collections.where(name: 'Cypress Test Area').destroy_all
  end
end
