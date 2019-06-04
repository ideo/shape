class SerializableAdminTestCollection < SerializableSimpleCollection
  type 'collections'

  attributes :name, :test_launched_at

  has_many :test_audiences do
    data do
      @object.paid_test_audiences
    end
  end
end
