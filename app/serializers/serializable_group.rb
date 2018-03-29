class SerializableGroup < BaseJsonSerializer
  type 'groups'
  attributes :id, :name, :handle
  attribute :filestack_file_url do
    if @object.filestack_file_url.present?
      @object.filestack_file_url
    else
      'https://cdn.filestackcontent.com/i4iKADquTQCWMAvyz02R'
    end
  end
  has_many :roles
end
