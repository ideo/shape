class SerializableRole < BaseJsonSerializer
  type 'roles'
  attributes :id, :name
  has_many :users
  has_many :groups
  belongs_to :resource
end
