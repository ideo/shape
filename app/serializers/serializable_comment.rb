class SerializableComment < BaseJsonSerializer
  type 'comments'
  attributes :id, :message, :updated_at, :comment_thread_id, :author_id
  belongs_to :author
end
