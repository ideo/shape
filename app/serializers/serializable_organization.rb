class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :id, :name, :domain_whitelist
  belongs_to :primary_group
  belongs_to :guest_group
end
