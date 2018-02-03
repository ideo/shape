class Collection < ApplicationRecord
  has_many :collection_cards
  # has_many :collection_card, as: :linkable
  has_many :items, through: :collection_cards
  belongs_to :organization
  belongs_to :cloned_from, class_name: 'Collection', optional: true

  enum collection_type: {
    normal: 1,
    root: 2,
  }

  validates :name, presence: true
end
