class DeserializableCollectionCard < BaseJsonDeserializer
  has_one :parent
  has_one :item
  has_one :collection
end
