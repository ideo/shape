class Notification < ApplicationRecord
  belongs_to :activity
  belongs_to :user

  after_create :store_in_firestore
  after_destroy :remove_from_firestore

  def self.relationships_for_firestore
    [
      activity: [:actor, :subject_users, :subject_groups]
    ]
  end

  def serialized_for_firestore
    include = Notification.relationships_for_firestore
    include = [activity: [:actor, :subject_users, :subject_groups, :target]]  if Activity.actions[:archived]
    renderer = JSONAPI::Serializable::Renderer.new
    renderer.render(
      self,
      class: { Activity: SerializableActivity,
               Notification: SerializableNotification,
               User: SerializableUser,
               Group: SerializableGroup,
               Collection: SerializableSimpleCollection,
               'Item::VideoItem': SerializableSimpleItem,
               'Item::ImageItem': SerializableSimpleItem,
               'Item::TextItem': SerializableSimpleItem,
             },
             include: include,
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
