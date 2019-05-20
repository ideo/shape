class SerializableAdminTestCollection < SerializableSimpleCollection
  type 'collections'

  attributes :name, :test_launched_at
end