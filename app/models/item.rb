class Item < ApplicationRecord
  # The primary collection that 'owns' this item
  has_one :primary_collection_card,
          -> { not_reference },
          class_name: 'CollectionCard'

  # All collections this is linked to
  has_many :collection_cards,
           -> { reference },
           as: :linkable

  delegate :collection, to: :primary_collection_card

end
