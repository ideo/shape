class SerializableTag < BaseJsonSerializer
  type 'tags'
  attributes :name, :taggings_count
end
