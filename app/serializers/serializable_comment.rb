class SerializableComment < BaseJsonSerializer
  type 'comments'
  attributes :message, :created_at, :updated_at, :comment_thread_id,
             :draftjs_data, :replies_count
  belongs_to :author
  belongs_to :parent

  attribute :author_id do
    @object.author_id.to_s
  end

  attribute :parent_id do
    @object.parent_id.to_s
  end

  has_many :children do
    data do
      @object.children.first 3
    end
  end
end
