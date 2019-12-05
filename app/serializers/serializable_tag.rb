class SerializableTag < BaseJsonSerializer
  type 'tags'
  attributes :name, :color, :organization_ids, :application_id

  belongs_to :application
end
