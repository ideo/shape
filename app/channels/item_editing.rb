class ItemEditingChannel < ApplicationCable::Channel
  # Called when the consumer has successfully
  # become a subscriber to this channel.
  def subscribed
    item = Item.find(params[:id])
    item.started_editing(current_user)
    stream_from item.stream_name
  end

  def unsubscribed
    item = Item.find(params[:id])
    item.stopped_editing(current_user)
  end
end
