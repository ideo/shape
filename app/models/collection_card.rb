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

  delegate :can_edit?, to: :parent, allow_nil: true
  delegate :can_view?, to: :parent, allow_nil: true

  scope :primary, -> { where(reference: false) }
  scope :reference, -> { where(reference: true) }
  scope :ordered, -> { order(order: :asc) }

  accepts_nested_attributes_for :collection, :item

  amoeba do
    enable
    exclude_association :collection
    exclude_association :item
    exclude_association :parent
  end

  def duplicate!(for_user:, shallow: false, update_order: false)
    cc = amoeba_dup
    cc.order += 1

    unless shallow
      cc.collection = collection.duplicate!(for_user: for_user) if collection.present?
      cc.item = item.duplicate!(for_user: for_user) if item.present?
    end

    if cc.save && update_order
      cc.increment_card_orders!
    end

    cc
  end

  def record
    return item if item.present?
    return collection if collection.present?
  end

  def record_type
    return nil if record.blank?
    record.class.base_class.name.underscore.to_sym
  end

  def primary?
    !reference
  end

  # Increment the order by 1 of all cards >= specified order
  # - Defaults to use this card's order
  # - Useful when inserting a new card to increment card order after this card
  def increment_card_orders!(starting_at_order = order)
    greater_than_or_equal = CollectionCard.arel_table[:order].gteq(starting_at_order)

    update_ids = parent.collection_cards
                       .where(greater_than_or_equal)
                       .where.not(id: id)
                       .pluck(:id)

    return true if update_ids.blank?

    CollectionCard.increment_counter(:order, update_ids)

    true
  end

  # Decrement the order by 1 of all cards with <= specified order
  # - Defaults to use this card's order
  # - Useful when removing a card from the collection
  def decrement_card_orders!(starting_at_order = nil)
    starting_at_order ||= order

    less_than_or_equal = CollectionCard.arel_table[:order].lteq(starting_at_order)

    update_ids = parent.collection_cards
                       .where(less_than_or_equal)
                       .where.not(id: id)
                       .pluck(:id)

    return true if update_ids.blank?

    CollectionCard.decrement_counter(:order, update_ids)

    true
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
