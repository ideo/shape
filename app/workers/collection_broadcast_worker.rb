class CollectionBroadcastWorker
  include Sidekiq::Worker

  def perform(collection_id)
    collection = Collection.find(collection_id)
    collection.cached_attributes.delete 'broadcasting'
    collection.save
    CollectionUpdateBroadcaster.call(collection)
  end
end
