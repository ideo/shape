class CollectionCard < ApplicationRecord
  include Archivable

  belongs_to :parent, class_name: 'Collection'
  belongs_to :collection, optional: true
  belongs_to :item, optional: true
  belongs_to :templated_from, class_name: 'CollectionCard', optional: true

  # this really is only appropriate for CollectionCard::Primary but defined globally here
  accepts_nested_attributes_for :collection, :item

  before_validation :assign_order, if: :assign_order?

  before_create :assign_default_height_and_width
  after_update :update_collection_cover, if: :saved_change_to_is_cover?
  after_create :update_parent_card_count!

  validates :parent, :order, presence: true
  validate :single_item_or_collection_is_present

  validate :parent_is_not_readonly, on: :create

  delegate :can_edit?, to: :record, allow_nil: true
  delegate :can_edit_content?, to: :record, allow_nil: true
  delegate :can_view?, to: :record, allow_nil: true

  scope :ordered, -> { order(order: :asc) }
  scope :pinned, -> { where(pinned: true) }
  scope :unpinned, -> { where(pinned: false) }

  amoeba do
    enable
    # propagate to STI models
    propagate
    nullify :templated_from_id
    # don't recognize any relations, easiest way to turn them all off
    recognize []
  end

  def duplicate!(
    for_user:,
    parent: self.parent,
    shallow: false,
    placement: 'end',
    duplicate_linked_records: false
  )
    if record.is_a? Collection::SharedWithMeCollection
      errors.add(:collection, 'cannot be a SharedWithMeCollection for duplication')
      return self
    end
    if link? && duplicate_linked_records
      # this option will create a real duplicate of the underlying record.
      # should only be used at the topmost level, e.g. if you duplicate a linked collection,
      # all the links *within* that collection should remain as links
      return record.parent_collection_card.duplicate!(
        for_user: for_user,
        parent: parent,
        shallow: shallow,
        placement: placement,
      )
    end
    cc = amoeba_dup
    if master_template_card? && parent.templated?
      # if we're cloning from template -> templated collection
      cc.templated_from = self
    elsif !(parent.templated? || parent.master_template?)
      # copying into a normal (non templated) collection, it should never be pinned
      cc.pinned = false
    end
    # defaults to self.parent, unless one is passed in
    cc.parent = parent
    # place card at beginning or end
    if placement == 'beginning'
      if parent.template.present?
        cc.order = parent.collection_cards.pinned.count
      else
        cc.order = 0
      end
    else
      cc.order = parent.collection_cards.count
    end

    unless shallow || link?
      opts = {
        for_user: for_user,
        parent: parent,
      }
      cc.collection = collection.duplicate!(opts) if collection.present?
      cc.item = item.duplicate!(opts) if item.present?
    end

    return cc unless cc.save
    # now that the card exists, we can recalculate the breadcrumb
    cc.record.recalculate_breadcrumb!
    cc.increment_card_orders! if placement == 'beginning'

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
    is_a? CollectionCard::Primary
  end

  def link?
    is_a? CollectionCard::Link
  end

  def master_template_card?
    # does this card live in a MasterTemplate?
    parent.master_template?
  end

  def pinned_and_locked?
    pinned? && !master_template_card?
  end

  def copy_into_new_link_card
    amoeba_dup.becomes!(CollectionCard::Link)
  end

  def system_required?
    collection.present? && collection.system_required?
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

  # Decrement the order by 1 of all cards with >= specified order
  # - Defaults to use this card's order
  # - Useful when removing a card from the collection
  def decrement_card_orders!(starting_at_order = order)
    greater_than_or_equal = CollectionCard.arel_table[:order].gteq(starting_at_order)

    update_ids = parent.collection_cards
                       .where(greater_than_or_equal)
                       .where.not(id: id)
                       .pluck(:id)

    return true if update_ids.blank?

    CollectionCard.decrement_counter(:order, update_ids)
    true
  end

  # gets called by child STI classes
  def after_archive_card
    decrement_card_orders!
    update_parent_card_count!
    cover = parent.cached_cover
    if cover && cover['card_ids'].include?(id)
      # regenerate parent collection cover if archived card was relevant
      parent.cache_cover!
    else
      # touch parent to bust cache
      parent.touch
    end
    record.try(:remove_comment_followers!)
  end

  # gets called by child STI classes
  def after_unarchive_card
    if should_update_parent_collection_cover?
      # regenerate parent collection cover if archived card was relevant
      parent.cache_cover!
    else
      # touch parent to bust cache
      parent.touch
    end
    parent.reorder_cards!
  end

  def self.with_record(record)
    if record.is_a?(Item)
      where(item_id: record.id)
    elsif record.is_a?(Collection)
      where(collection_id: record.id)
    else
      []
    end
  end

  def should_update_parent_collection_cover?
    collection = try(:parent)
    return unless collection.present? && collection.display_cover?
    cover = collection.cached_cover
    cover.blank? ||
      cover['card_ids'].blank? ||
      (cover['text'].blank? && text_card?) ||
      (cover['image_url'].blank? && media_card?) ||
      cover['card_ids'].include?(id) ||
      cover['card_order'].nil? ||
      order <= cover['card_order']
  end

  def text_card?
    record.is_a? Item::TextItem
  end

  def media_card?
    record.is_a?(Item::VideoItem) || record.is_a?(Item::FileItem)
  end

  def card_question_type
    return nil unless parent.is_a?(Collection::TestCollection) || parent.is_a?(Collection::TestDesign)
    return nil unless item.present?
    case item.type
    when 'Item::QuestionItem'
      return item.question_type
    when 'Item::TextItem'
      return 'question_description'
    when 'Item::FileItem', 'Item::VideoItem'
      return 'question_media'
    end
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

  def resourceable_class
    # Use top-level class since this is an STI model
    CollectionCard
  end

  def single_item_or_collection_is_present
    return unless item.present? && collection.present?

    errors.add(:base, 'Only one of Item or Collection can be assigned')
  end

  def parent_is_not_readonly
    return if parent.blank?

    errors.add(:parent, 'is read-only so you can\'t save this card') if parent.read_only?
  end

  def update_collection_cover
    if is_cover
      # A new cover was selected so turn off other covers
      parent.collection_cards.where.not(id: id).update_all(is_cover: false)
      parent.cache_cover!
    else
      # The cover was de-selected so turn off the cover on the collection
      parent.update(cached_cover: { no_cover: true })
    end
  end
  
  def update_parent_card_count!
    parent.cache_card_count!
  end
end
