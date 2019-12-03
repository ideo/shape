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

  # NOTE: this method is not currently used as we investigate whether the frequency of updates
  # was causing some of the collaborative issues.
  # Resurrect `CollectionPage.js#handleTextItemUpdate` from this commit if you wish to restore.
  def text_item_updated(item)
    return if @collection.nil?

    @collection.received_changes(
      {
        item: {
          id: item.id,
          quill_data: item.quill_data,
        },
      },
      @user,
    )
  end
end
