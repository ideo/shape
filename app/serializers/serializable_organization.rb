class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :id, :name, :domain_whitelist, :slug
  belongs_to :primary_group
  belongs_to :guest_group
  belongs_to :admin_group
end
