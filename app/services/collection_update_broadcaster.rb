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

  def text_item_updated(item)
    return if @collection.nil?
    @collection.received_changes(
      {
        item: {
          id: item.id,
          data_content: item.data_content,
        },
      },
      @user,
    )
  end
end
