class SerializableComment < BaseJsonSerializer
  type 'comments'
  attributes :message, :created_at, :updated_at, :comment_thread_id,
             :author_id, :draftjs_data
  belongs_to :author
end
