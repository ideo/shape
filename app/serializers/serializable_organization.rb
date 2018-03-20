class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :id, :name, :filestack_file_url
  attribute :pic_url_square do
    if @object.pic_url_square
      @object.pic_url_square
    else
      'https://cdn.filestackcontent.com/XYWsMijFTDWBsGzzKEEo'
    end
  end
end
