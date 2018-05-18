class SerializableComment < BaseJsonSerializer
  type 'comments'
  attributes :id, :message, :created_at
  belongs_to :author
end
