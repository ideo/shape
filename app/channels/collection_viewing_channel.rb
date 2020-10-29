class CollectionViewingChannel < ApplicationCable::Channel
  # All public methods are exposed to consumers

  def subscribed
    return reject if collection.nil? || current_ability.cannot?(:read, collection)

    stream_from collection.stream_name
    collection.started_viewing(current_user)
  end

  def unsubscribed
    return reject if collection.nil?

    collection.stopped_viewing(current_user)
  end

  def cards_selected(data)
    return reject if collection.nil?

    collection.received_changes({ cards_selected: data['card_ids'] }, current_user)
  end

  def cursor(data)
    return reject if collection.nil?

    collection.received_changes(data, current_user, include_all_collaborators: false)
  end

  private

  def collection
    Collection.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    nil
  end
end
