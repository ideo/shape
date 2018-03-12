class SerializableRole < BaseJsonSerializer
  type 'roles'
  attributes :id, :name
  has_many :users
  belongs_to :resource
end
