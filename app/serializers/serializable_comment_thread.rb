class SerializableCommentThread < BaseJsonSerializer
  type 'comment_threads'
  attributes :id, :updated_at
  belongs_to :record
end
