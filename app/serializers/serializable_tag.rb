class SerializableTag < BaseJsonSerializer
  type 'tags'
  attributes :name, :color, :organization_ids
end
