class CollectionUpdateBroadcaster < SimpleService
  def initialize(collection, user)
    @collection = collection
    @user = user
  end

  def call
    # edited method comes from RealtimeEditorsViewers concern
    @collection.started_editing(@user)
  end
end
