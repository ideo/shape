class SerializableUsersThread < BaseJsonSerializer
  type 'users_threads'
  attributes :last_viewed_at,
             # just store these as attributes, don't need the whole relation
             :comment_thread_id, :user_id
  # this is a calculated value from UsersThread
  attribute :unread_count

  attribute :identifier do
    "#{@object.comment_thread.organization_id}_#{@object.user_id}"
  end
end
