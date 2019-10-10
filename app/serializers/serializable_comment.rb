class SerializableComment < BaseJsonSerializer
  type 'comments'
  attributes :message, :created_at, :updated_at, :comment_thread_id,
             :draftjs_data, :replies_count, :status
  belongs_to :author
  belongs_to :parent
  belongs_to :subject

  attribute :author_id do
    @object.author_id.to_s
  end

  attribute :parent_id do
    @object.parent_id.to_s
  end

  has_many :latest_replies do
    data do
      @object.replies.first 3
    end
  end
end
