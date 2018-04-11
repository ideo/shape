class ItemEditingChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    item = Item.find(params[:id])
    item.started_viewing(current_user)
    stream_from item.stream_name
  end

  def start_editing
    item = Item.find(params[:id])
    item.started_editing(current_user)
  end

  def stop_editing
    item = Item.find(params[:id])
    item.stopped_editing(current_user)
  end

  def unsubscribed
    item = Item.find(params[:id])
    item.stopped_viewing(current_user, dont_notify: true)
    item.stopped_editing(current_user)
  end
end
