class CollectionBroadcastWorker
  include Sidekiq::Worker

  def perform(collection_id)
    collection = Collection.find(collection_id)
    collection.cached_attributes.delete 'broadcasting'
    collection.save
    # NOTE: we don't broadcast with any user info in this case.
    # This is because if two edits happen in this timespan, e.g. User 1 and User 2,
    # then User 2 will see it as their own edit and ignore the update
    CollectionUpdateBroadcaster.call(collection)
  end
end
