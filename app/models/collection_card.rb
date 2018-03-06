class CollectionCard < ApplicationRecord
  include Archivable
  archivable with: %i[collection item]

  belongs_to :parent, class_name: 'Collection'

  # TODO: Need to refactor CollectionCards to have a subclass e.g. CollectionCard::LinkedCollectionCard
  # Currently this `collection` vs. `referenced_collection` doesn't exactly work because there's nothing
  # differentiating the two relationships.
  belongs_to :collection, optional: true, inverse_of: :parent_collection_card
  belongs_to :item, optional: true, inverse_of: :parent_collection_card
  belongs_to :referenced_item, class_name: 'Item', optional: true, inverse_of: :reference_collection_cards, foreign_key: 'item_id'
  belongs_to :referenced_collection, class_name: 'Collection', optional: true, inverse_of: :reference_collection_cards, foreign_key: 'collection_id'

  before_validation :assign_order, if: :assign_order?
  before_create :assign_default_height_and_width

  validates :parent, :order, presence: true
  validate :single_item_or_collection_is_present
  validate :card_is_only_primary_card, if: :check_if_primary_card_is_unique?
  validate :parent_is_not_readonly, on: :create

  scope :primary, -> { where(reference: false) }
  scope :reference, -> { where(reference: true) }

  accepts_nested_attributes_for :collection, :item

  def record
    return item if item.present?
    return collection if collection.present?
  end

  def record_type
    record.class.base_class.name.underscore.to_sym
  end

  def primary?
    !reference
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
    # look for an existing primary CollectionCard that is already pointed to this record
    if record.present? && record.persisted? && CollectionCard.primary.where("#{record_type}_id": record.id).count.positive?
      errors.add(record_type, 'already has a primary card')
    end
  end

  def parent_is_not_readonly
    return if parent.blank?

    errors.add(:parent, 'is read-only so you can\'t save this card') if parent.read_only?
  end
end
