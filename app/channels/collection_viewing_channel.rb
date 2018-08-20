class CollectionViewingChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    collection = Collection.find(params[:id])
    collection.started_viewing(current_user)
    stream_from collection.stream_name
  end

  def edited(user)
    collection = Collection.find(params[:id])
    collection.edited(current_user)
  end

  def unsubscribed
    collection = Collection.find(params[:id])
    collection.stopped_viewing(current_user, dont_notify: true)
  end
end

