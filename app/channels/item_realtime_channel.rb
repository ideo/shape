class ItemRealtimeChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    return reject if item.nil? || !item.can_edit_content?(current_user)
    item.started_viewing(current_user)
    stream_from item.stream_name
  end

  def unsubscribed
    return reject if item.nil?
    item.stopped_viewing(current_user)
  end

  def delta(data)
    return reject if item.nil?
    # update delta with transformed one
    new_data = item.threadlocked_transform_realtime_delta(current_user, Mashie.new(data))
    # new_data may include an error message
    item.received_changes(new_data, current_user)
    CollectionUpdateBroadcaster.new(item.parent, current_user).text_item_updated(item)
  end

  def cursor(data)
    return reject if item.nil?
    item.received_changes(data, current_user)
  end

  private

  def item
    Item.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    nil
  end
end
