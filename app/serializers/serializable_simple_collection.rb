class SerializableSimpleCollection < BaseJsonSerializer
  type 'collections'

  attributes :id, :created_at, :updated_at, :name, :organization_id
  attribute :cover do
    @object.cached_cover || {}
  end

  attribute :type do
    @object.type || @object.class.name
  end
end
