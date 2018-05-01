class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :id, :name
  belongs_to :primary_group
end
