class CollectionUpdateBroadcaster < SimpleService
  def initialize(collection, updater)
    @collection = collection
    @updator = updater
  end

  def call
    @collection.edited(@updator)
  end
end
