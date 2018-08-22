class CollectionUpdateBroadcaster < SimpleService
  def initialize(collection, updater)
    @collection = collection
    @updater = updater
  end

  def call
    @collection.edited(@updater)
  end
end
