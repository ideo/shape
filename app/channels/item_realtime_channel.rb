class ItemRealtimeChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    item = Item.find(params[:id])
    item.started_viewing(current_user)
    stream_from item.stream_name
  rescue ActiveRecord::RecordNotFound
    nil
  end

  def unsubscribed
    item = Item.find(params[:id])
    item.stopped_viewing(current_user, dont_notify: true)
    item.stopped_editing(current_user)
  rescue ActiveRecord::RecordNotFound
    nil
  end

  def delta(data)
    item = Item.find(params[:id])
    # update delta with transformed one
    data['data'] = item.transform_realtime_delta(data['delta'], data['version'])
    item.received_changes(data, current_user)
  rescue ActiveRecord::RecordNotFound
    nil
  end
end
