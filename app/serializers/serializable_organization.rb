class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :id, :name, :pic_url_square
end
