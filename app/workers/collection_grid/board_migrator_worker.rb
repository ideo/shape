module CollectionGrid
  class BoardMigratorWorker
    include Sidekiq::Worker
    sidekiq_options queue: 'critical'

    def perform(collection_id)
      @collection = Collection.find(collection_id)
      CollectionGrid::BoardMigrator.call(collection: @collection)
    end
  end
end
