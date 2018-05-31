class UsersThread < ApplicationRecord
  belongs_to :user
  belongs_to :comment_thread

  before_create do
    self.last_viewed_at = Time.now
  end

  def update_last_viewed!
    update(last_viewed_at: Time.now)
  end

  def unread_count
    comment_thread
      .comments
      .order(updated_at: :desc)
      .where('updated_at > ?', last_viewed_at)
      .count
  end

  def serialized_for_firestore
    renderer = JSONAPI::Serializable::Renderer.new
    renderer.render(
      self,
      class: { UsersThread: SerializableUsersThread },
    )
  end

  def store_in_firestore
    # TODO: background job
    FirestoreClient.new.write("users_threads/#{id}", serialized_for_firestore)
  end

  # def self.store_in_firestore(user_id:)
  #   FirestoreClient.new.write(
  #     "users_threads/#{user_id}",
  #     serialized_for_firestore(user_id: user_id),
  #   )
  # end
end
