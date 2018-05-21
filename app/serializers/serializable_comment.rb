class SerializableComment < BaseJsonSerializer
  type 'comments'
  attributes :id, :message, :updated_at
  belongs_to :author
end
