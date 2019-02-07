class SerializableCommentThread < BaseJsonSerializer
  type 'comment_threads'
  attributes :updated_at
  belongs_to :record

  has_one :users_thread do
    data do
      @object.users_thread_for(@current_user)
    end
  end
end
