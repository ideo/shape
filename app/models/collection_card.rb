class CollectionCard < ApplicationRecord
  belongs_to :parent, class_name: 'Collection'
  belongs_to :collection, optional: true
  belongs_to :item, optional: true

  validates :parent, :order, presence: true
  validate :single_item_or_collection_is_present
  validate :card_is_only_primary_card, if: :check_if_primary_card_is_unique?

  scope :not_reference, -> { where(reference: false) }
  scope :reference, -> { where(reference: true) }

  private

  def single_item_or_collection_is_present
    return unless item.present? && collection.present?

    errors.add(:base, 'Only one of Item or Collection can be assigned')
  end

  def check_if_primary_card_is_unique?
    !reference? && (new_record? || reference_changed?)
  end

  def card_is_only_primary_card
    if item.present? && item.primary_collection_card.present?
      errors.add(:item, 'already has a primary card')
    elsif collection.present? && collection.primary_collection_card.present?
      errors.add(:collection, 'already has a primary card')
    end
  end
end
