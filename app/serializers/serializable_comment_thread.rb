class SerializableCommentThread < BaseJsonSerializer
  type 'comment_threads'
  attributes :updated_at
  belongs_to :record
end
