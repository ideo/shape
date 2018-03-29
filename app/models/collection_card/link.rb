class CollectionCard
  class Link < CollectionCard
    belongs_to :collection,
               optional: true,
               inverse_of: :cards_linked_to_this_collection
    belongs_to :item,
               optional: true,
               inverse_of: :cards_linked_to_this_item
  end
end
