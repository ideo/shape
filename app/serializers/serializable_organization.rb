class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :id, :name
  belongs_to :primary_group
  attribute :filestack_file_url do
    if @object.filestack_file_url.present?
      @object.filestack_file_url
    else
      'https://cdn.filestackcontent.com/1xg8eDXESiKXqod8mZKr'
    end
  end
end
