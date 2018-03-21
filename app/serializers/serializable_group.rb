class SerializableGroup < BaseJsonSerializer
  type 'groups'
  attributes :id, :name, :handle, :filestack_file_url
  has_many :roles
end
