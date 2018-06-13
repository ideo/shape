class SerializableComment < BaseJsonSerializer
  type 'comments'
  attributes :id, :message, :updated_at, :comment_thread_id, :author_id,
             :draftjs_data
  belongs_to :author
end
