class Collection < ApplicationRecord
  has_many :collection_cards, foreign_key: :parent_id
  has_one :primary_collection_card,
          -> { not_reference },
          class_name: 'CollectionCard'
  has_many :items, through: :collection_cards
  has_many :collections, through: :collection_cards
  belongs_to :organization
  belongs_to :cloned_from, class_name: 'Collection', optional: true

  delegate :parent, to: :primary_collection_card, allow_nil: true

  enum collection_type: {
    normal: 1,
    root: 2,
  }

  validates :name, presence: true
end
