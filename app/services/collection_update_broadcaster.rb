class CollectionUpdateBroadcaster < SimpleService
  def initialize(collection, user)
    @collection = collection
    @user = user
  end

  def call
    # edited method comes from RealtimeEditorsViewers concern
    @collection.started_editing(@user)
    # now unset the "current_editor" since each collection edit is a one-off
    @collection.stopped_editing(@user, dont_notify: true)
  end
end
