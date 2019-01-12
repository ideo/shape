class CollectionUpdateBroadcaster < SimpleService
  def initialize(collection, user = nil)
    @collection = collection
    @user = user
  end

  def call
    return if @collection.nil?
    # single_edit method comes from RealtimeEditorsViewers concern
    @collection.single_edit(@user)
  end
end
