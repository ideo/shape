class SerializableCollectionCard < BaseJsonSerializer
  type 'collection_cards'
  attributes :id, :order, :width, :height, :reference
  belongs_to :item
  belongs_to :collection
  belongs_to :parent
  belongs_to :record
end
