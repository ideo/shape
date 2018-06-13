class SerializableSimpleGroup < BaseJsonSerializer
  type 'groups'
  attributes :id, :name, :handle
  attribute :is_primary do
    @object.primary?
  end
  attribute :is_guest do
    @object.guest?
  end
  attribute :filestack_file_url do
    if @object.filestack_file_url.present?
      @object.filestack_file_url
    else
      'https://cdn.filestackcontent.com/i4iKADquTQCWMAvyz02R'
    end
  end
end
