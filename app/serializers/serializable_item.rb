class SerializableItem < BaseJsonSerializer
  type 'items'
  attributes :id, :type, :name, :content
end
