class SerializableGroup < BaseJsonSerializer
  type 'groups'
  attributes :id, :name, :tag
  has_many :admins do
    data { @object.admins }
  end
  has_many :members do
    data { @object.members }
  end
end
