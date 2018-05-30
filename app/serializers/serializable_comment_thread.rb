class SerializableCommentThread < BaseJsonSerializer
  type 'comment_threads'
  attributes :id, :updated_at
  belongs_to :record
  has_many :unread_comments do
    data do
      @object.latest_unread_comments_for(@current_user)
    end
  end

  attribute :unread_count do
    @object.unread_comment_count_for(@current_user)
  end
end
