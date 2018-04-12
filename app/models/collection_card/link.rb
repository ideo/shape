class CollectionCard
  class Link < CollectionCard
    after_archive :decrement_card_orders!

    belongs_to :collection,
               optional: true,
               inverse_of: :cards_linked_to_this_collection
    belongs_to :item,
               optional: true,
               inverse_of: :cards_linked_to_this_item
  end
end
