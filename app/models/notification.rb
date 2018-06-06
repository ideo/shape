class Notification < ApplicationRecord
  belongs_to :activity
  belongs_to :user

  after_create :store_in_firestore
  after_destroy :remove_from_firestore

  def combined_actor_ids(limit: nil)
    Activity
      .select(:actor_id, 'max(created_at) as created')
      .where(id: combined_activities_ids)
      .order('created DESC')
      .group(:actor_id)
      .limit(limit)
      .to_a # otherwise pluck will turn it into an incorrect query
      .pluck(:actor_id)
  end

  def combined_actor_count
    combined_actor_ids.count
  end

  def combined_actors(limit: 3)
    User.where(id: combined_actor_ids(limit: limit))
  end

  def relationships_for_firestore
    if activity.archived?
      [
        activity: %i[actor subject_users subject_groups target],
      ]
    else
      [
        :combined_actors,
        activity: %i[actor subject_users subject_groups],
      ]
    end
  end

  def serialized_for_firestore
    renderer = JSONAPI::Serializable::Renderer.new
    renderer.render(
      self,
      class: { Activity: SerializableActivity,
               Notification: SerializableNotification,
               User: SerializableUser,
               Group: SerializableSimpleGroup,
               Collection: SerializableSimpleCollection,
               'Item::VideoItem': SerializableSimpleItem,
               'Item::ImageItem': SerializableSimpleItem,
               'Item::TextItem': SerializableSimpleItem },
      include: relationships_for_firestore,
    )
  end

  def store_in_firestore
    FirestoreClient.new.write("notifications/#{id}", serialized_for_firestore)
  end

  def remove_from_firestore
    obj = FirestoreClient.new.read("notifications/#{id}")
    obj&.delete
  end
end
