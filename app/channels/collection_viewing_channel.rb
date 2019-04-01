class CollectionViewingChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    return reject if collection.nil?
    collection.started_viewing(current_user)
    stream_from collection.stream_name
  end

  def edited
    return reject if collection.nil?
    collection.started_editing(current_user)
  end

  def unsubscribed
    return reject if collection.nil?
    collection.stopped_viewing(current_user, dont_notify: true)
  end

  private

  def collection
    Collection.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    nil
  end
end
