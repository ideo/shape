class SerializableCommentThread < BaseJsonSerializer
  type 'comment_threads'
  attributes :id, :updated_at
  belongs_to :record
  # has_many :recent_comments do
  #   data do
  #     # comments are already ordered by updated_at
  #     @object.comments.limit(3)
  #   end
  # end
end
