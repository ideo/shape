class DeserializableCollection < BaseJsonDeserializer
  has_one :organization
  has_many :collection_cards
end
