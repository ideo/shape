class UsersThread < ApplicationRecord
  include Firestoreable

  belongs_to :user
  belongs_to :comment_thread

  before_create do
    self.last_viewed_at = Time.now
  end

  # gets cached on serialized_for_firestore
  delegate :updated_at, to: :comment_thread

  def update_last_viewed!
    update(last_viewed_at: Time.now)
    store_in_firestore
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
end
