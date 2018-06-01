class Notification < ApplicationRecord
  belongs_to :activity
  belongs_to :user

  after_create :store_in_firestore
  after_destroy :remove_from_firestore

  def serialized_for_firestore
    renderer = JSONAPI::Serializable::Renderer.new
    renderer.render(
      self,
      class: { Activity: SerializableActivity,
               Notification: SerializableNotification,
               User: SerializableUser,
               Group: SerializableGroup,
             },
             include: [:subject_users, :subject_groups, activity: [:actor]],
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
