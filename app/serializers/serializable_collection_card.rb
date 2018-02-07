class SerializableCollectionCard < BaseJsonSerializer
  type 'collection_cards'
  attributes :id, :order, :width, :height, :reference
  belongs_to :item
  belongs_to :collection
end
