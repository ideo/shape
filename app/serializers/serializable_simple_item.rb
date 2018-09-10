class SerializableSimpleItem < BaseJsonSerializer
  type 'items'
  attributes :type, :name
  attribute :filestack_file_url do
    @object.cached_filestack_file_url || ''
  end
end
