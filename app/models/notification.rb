class Notification < ApplicationRecord
  belongs_to :activity
  belongs_to :user

  after_create :store_in_firestore
  after_destroy :remove_from_firestore

  def relationships_for_firestore
    if activity.archived?
      [
        activity: %i[actor subject_users subject_groups target],
      ]
    else
      [
        activity: %i[actor subject_users subject_groups],
        combined_activities: %i[actor],
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
