class CollectionCardSerializer < FastJsonSerializer
  set_type 'collection_cards'
  attributes :order, :width, :height, :reference
  belongs_to :linkable, serializer: :item
end
