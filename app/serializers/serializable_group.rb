class SerializableGroup < BaseJsonSerializer
  type 'groups'
  attributes :id, :name, :handle, :filestack_file_url
  has_many :admins do
    data { @object.admins }
  end
  has_many :members do
    data { @object.members }
  end
end
