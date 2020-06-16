class SerializableTag < BaseJsonSerializer
  type 'tags'
  attributes :name, :tag_type
end
