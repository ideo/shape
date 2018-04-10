class ItemEditingChannel < ApplicationCable::Channel
  # Called when the consumer has successfully become a subscriber to this channel.
  def subscribed
    stream_from Item.editing_stream_name(params[:id])
  end

  # All public methods are exposed to consumers
  def start_editing
    item = Item.find(params[:id])
    item.started_editing(current_user)
  end

  def stop_editing
    item = Item.find(params[:id])
    item.stopped_editing(current_user)
  end

  def unsubscribed
    # Make sure they get marked as stopped editing
    item = Item.find(params[:id])
    item.stopped_editing(current_user)
  end
end
