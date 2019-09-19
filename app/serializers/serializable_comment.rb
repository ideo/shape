class SerializableComment < BaseJsonSerializer
  type 'comments'
  attributes :message, :created_at, :updated_at, :comment_thread_id,
             :author_id, :draftjs_data, :parent_id
  belongs_to :author
  belongs_to :parent
  has_many :children do
    data do
      @object.children.last 3
    end
  end
end
