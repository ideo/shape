class Collection < ApplicationRecord
  has_many :collection_cards, foreign_key: :parent_id
  has_one :primary_collection_card,
          -> { not_reference },
          class_name: 'CollectionCard'
  has_many :items, through: :collection_cards
  has_many :collections, through: :collection_cards
  belongs_to :organization, optional: true
  belongs_to :cloned_from, class_name: 'Collection', optional: true

  scope :root, -> { where.not(organization_id: nil) }

  delegate :parent, to: :primary_collection_card, allow_nil: true

  validates :name, presence: true
  validates :organization, presence: true, if: :primary_collection_card_blank?

  accepts_nested_attributes_for :collection_cards

  enum collection_type: {
    normal: 1,
    user: 2,
  }

  def root?
    organization_id.present?
  end

  private

  def primary_collection_card_blank?
    primary_collection_card.blank?
  end
end
