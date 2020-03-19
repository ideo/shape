class CollectionBroadcastWorker
  include Sidekiq::Worker

  def perform(collection_id, user_id)
    collection = Collection.find(collection_id)
    user = User.find(user_id)
    collection.cached_attributes.delete 'broadcasting'
    collection.save
    CollectionUpdateBroadcaster.call(collection, user)
  end
end
