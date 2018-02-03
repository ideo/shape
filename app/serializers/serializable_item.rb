class SerializableItem < BaseJsonSerializer
  type 'items'
  attributes :id, :name, :content
end
