class SerializableAdminTestCollection < SerializableSimpleCollection
  type 'collections'

  attributes :name, :test_launched_at

  has_many :test_audiences
end