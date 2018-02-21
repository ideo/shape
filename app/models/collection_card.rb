class CollectionCard < ApplicationRecord
  belongs_to :parent, class_name: 'Collection'
  belongs_to :collection, optional: true
  belongs_to :item, optional: true

  before_validation :assign_order, if: :assign_order?
  before_create :assign_default_height_and_width

  validates :parent, :order, presence: true
  validate :single_item_or_collection_is_present
  validate :card_is_only_primary_card, if: :check_if_primary_card_is_unique?
  validate :parent_is_not_readonly, on: :create

  scope :not_reference, -> { where(reference: false) }
  scope :reference, -> { where(reference: true) }

  accepts_nested_attributes_for :collection, :item

  def record
    return item if item.present?
    return collection if collection.present?
  end

  private

  def assign_default_height_and_width
    self.height ||= 1
    self.width ||= 1
  end

  def assign_order?
    order.blank? && parent.present?
  end

  def assign_order
    self.order = parent.collection_cards.maximum(:order) || 0
  end

  def single_item_or_collection_is_present
    return unless item.present? && collection.present?

    errors.add(:base, 'Only one of Item or Collection can be assigned')
  end

  def check_if_primary_card_is_unique?
    !reference? && (new_record? || reference_changed?)
  end

  def card_is_only_primary_card
    if item.present? && item.parent_collection_card.present?
      errors.add(:item, 'already has a primary card')
    elsif collection.present? && collection.parent_collection_card.present?
      errors.add(:collection, 'already has a primary card')
    end
  end

  def parent_is_not_readonly
    return if parent.blank?

    errors.add(:parent, 'is read-only so you can\'t save this card') if parent.read_only?
  end
end
