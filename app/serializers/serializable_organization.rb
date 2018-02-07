class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :id, :name
end
