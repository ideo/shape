class SerializableTestCollection < SerializableSimpleCollection
  type 'collections'

  has_many :collection_cards do
    data do
      @object.try(:test_design).try(:collection_cards)
    end
  end
end
