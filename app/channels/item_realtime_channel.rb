class ItemRealtimeChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    reject unless item.can_edit_content? current_user
    item.started_viewing(current_user)
    stream_from item.stream_name
  rescue ActiveRecord::RecordNotFound
    nil
  end

  def unsubscribed
    item.stopped_viewing(current_user, dont_notify: true)
  rescue ActiveRecord::RecordNotFound
    nil
  end

  def delta(data)
    # update delta with transformed one
    new_data = item.threadlocked_transform_realtime_delta(Mashie.new(data))
    if new_data
      item.received_changes(new_data, current_user)
    else
      item.received_changes({ error: 'failed' }, current_user)
    end
  rescue ActiveRecord::RecordNotFound
    nil
  end

  def cursor(data)
    item.received_changes(data, current_user)
  rescue ActiveRecord::RecordNotFound
    nil
  end

  private

  def item
    @item ||= Item.find(params[:id])
  end
end
