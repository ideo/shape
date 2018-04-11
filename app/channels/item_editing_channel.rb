class ItemEditingChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    item = Item.find(params[:id])
    item.started_viewing(current_user, notify: false)
    stream_from item.editing_stream_name
  end

  def start_editing
    item = Item.find(params[:id])
    item.started_editing(current_user)
  end

  def stop_editing
    item = Item.find(params[:id])
    item.stopped_editing(current_user, notify: false)
  end

  def unsubscribed
    item = Item.find(params[:id])
    item.stopped_viewing(current_user, notify: false)
    item.stopped_editing(current_user)
  end
end
