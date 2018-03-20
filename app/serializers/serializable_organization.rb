class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :id, :name
  attribute :filestack_file_url do
    if @object.filestack_file_url.present?
      @object.filestack_file_url
    else
      'https://cdn.filestackcontent.com/XYWsMijFTDWBsGzzKEEo'
    end
  end
end
