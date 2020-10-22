class ItemRealtimeChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    return reject if item.nil? || current_ability.cannot?(:edit_content, item)

    item.started_viewing(current_user)
    stream_from item.stream_name
  end

  def unsubscribed
    return reject if item.nil?

    item.stopped_viewing(current_user)
  end

  def delta(data)
    return reject if item.nil?

    item.save_and_broadcast_quill_data(current_user, Mashie.new(data))
  end

  def cursor(data)
    return reject if item.nil?

    item.received_changes(data, current_user)
  end

  def background_color(data)
    return reject if item.nil?

    item.save_and_broadcast_background(current_user, Mashie.new(data))
  end

  private

  def item
    Item.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    nil
  end
end
