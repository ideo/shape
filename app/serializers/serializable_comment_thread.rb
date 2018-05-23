class SerializableCommentThread < BaseJsonSerializer
  type 'comment_threads'
  attributes :id, :updated_at
  belongs_to :record
  has_many :first_comments do
    data do
      @object.comments.limit(2)
    end
  end
end
