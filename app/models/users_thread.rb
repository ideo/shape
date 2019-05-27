# == Schema Information
#
# Table name: users_threads
#
#  id                :bigint(8)        not null, primary key
#  last_viewed_at    :datetime
#  subscribed        :boolean          default(TRUE)
#  created_at        :datetime         not null
#  comment_thread_id :bigint(8)
#  user_id           :bigint(8)
#
# Indexes
#
#  by_users_comment_thread  (user_id,comment_thread_id) UNIQUE
#

class UsersThread < ApplicationRecord
  include Firestoreable

  belongs_to :user
  belongs_to :comment_thread

  before_create do
    self.last_viewed_at = Time.now
    self.subscribed = comment_thread.record.any_parent_unsubscribed?(user) ? false : subscribed
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
      .order(created_at: :desc)
      .where('created_at > ?', last_viewed_at)
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
