# == Schema Information
#
# Table name: collection_cards
#
#  id                :bigint(8)        not null, primary key
#  archive_batch     :string
#  archived          :boolean          default(FALSE)
#  archived_at       :datetime
#  col               :integer
#  filter            :integer          default("transparent_gray")
#  height            :integer
#  hidden            :boolean          default(FALSE)
#  image_contain     :boolean          default(FALSE)
#  is_cover          :boolean          default(FALSE)
#  order             :integer          not null
#  pinned            :boolean          default(FALSE)
#  row               :integer
#  show_replace      :boolean          default(TRUE)
#  type              :string
#  unarchived_at     :datetime
#  width             :integer
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  collection_id     :bigint(8)
#  item_id           :bigint(8)
#  parent_id         :bigint(8)
#  templated_from_id :integer
#
# Indexes
#
#  index_collection_cards_on_collection_id          (collection_id)
#  index_collection_cards_on_item_id                (item_id)
#  index_collection_cards_on_order_and_row_and_col  (order,row,col)
#  index_collection_cards_on_parent_id              (parent_id)
#  index_collection_cards_on_templated_from_id      (templated_from_id)
#  index_collection_cards_on_type                   (type)
#

class CollectionCard < ApplicationRecord
  include Archivable

  DEFAULT_PER_PAGE = 50
  paginates_per DEFAULT_PER_PAGE

  belongs_to :parent, class_name: 'Collection'
  belongs_to :collection, optional: true
  belongs_to :item, optional: true
  belongs_to :templated_from, class_name: 'CollectionCard', optional: true

  # this really is only appropriate for CollectionCard::Primary but defined globally here
  accepts_nested_attributes_for :collection, :item
  # for the purpose of accepting this param via deserializable
  attr_accessor :external_id

  before_validation :assign_order, if: :assign_order?
  before_validation :ensure_width_and_height

  before_create :assign_default_height_and_width
  after_update :update_collection_cover, if: :saved_change_to_is_cover?
  after_update :touch_collection, if: :saved_change_to_filter?
  after_create :update_parent_card_count!
  after_save :set_collection_as_master_template,
             if: :test_collection_within_master_template_after_save?

  validates :parent, :order, presence: true
  validate :single_item_or_collection_is_present
  validate :parent_is_not_readonly, on: :create
  validates :col,
            inclusion: { in: Collection::Board.allowed_col_range.to_a },
            if: :parent_board_collection?
  validates :row,
            numericality: { greater_than_or_equal_to: 0 },
            if: :parent_board_collection?

  delegate :board_collection?,
           to: :parent,
           prefix: true,
           allow_nil: true

  delegate :can_edit?,
           :can_edit_content?,
           :can_view?,
           to: :record,
           allow_nil: true

  scope :ordered, -> { order(order: :asc) }
  scope :ordered_row_col, -> { reorder(row: :asc, col: :asc) }
  scope :pinned, -> { where(pinned: true) }
  scope :unpinned, -> { where(pinned: false) }
  scope :visible, -> { where(hidden: false) }
  scope :is_cover, -> { where(is_cover: true) }
  scope :primary, -> { where(type: 'CollectionCard::Primary') }
  scope :link, -> { where(type: 'CollectionCard::Link') }

  enum filter: {
    nothing: 0,
    transparent_gray: 1,
  }

  amoeba do
    enable
    # propagate to STI models
    propagate
    nullify :templated_from_id
    # don't recognize any relations, easiest way to turn them all off
    recognize []

  end

  def self.default_relationships_for_api
    [
      :parent,
      record: [
        :filestack_file,
        :datasets,
        collection_cover_items: :datasets,
      ],
    ]
  end

  def duplicate!(
    for_user: nil,
    parent: self.parent,
    shallow: false,
    placement: 'end',
    duplicate_linked_records: false,
    building_template_instance: false,
    system_collection: false,
    synchronous: false
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
        system_collection: system_collection,
        synchronous: synchronous,
      )
    end
    cc = amoeba_dup
    if master_template_card? && parent.templated?
      # if we're cloning from template -> templated collection
      cc.templated_from = self
    elsif parent.master_template?
      # Make it pinned if you're duplicating it into a master template
      cc.pinned = true
    else
      # copying into a normal (non templated) collection, it should never be pinned;
      # likewise even if you duplicate a pinned card in your own instance
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
    elsif placement == 'end'
      cc.order = parent.collection_cards.count
    elsif placement.is_a? Integer
      cc.order = placement
    end

    # Nullify is_cover if the collection going into already has a cover or
    # should specifically not have a cover.
    cc.is_cover = false if parent.cached_cover.try(:[], 'no_cover') == true
    cc.is_cover = false if parent.collection_cards.is_cover.count.positive?

    unless shallow || link?
      opts = {
        for_user: for_user,
        parent: parent,
        system_collection: system_collection,
        synchronous: synchronous,
      }
      coll_opts = opts.merge(
        building_template_instance: building_template_instance,
      )
      if collection.present?
        cc.collection = collection.duplicate!(coll_opts)
        set_collection_as_master_template if master_template_card? && collection.is_a?(Collection::TestCollection)
      elsif item.present?
        cc.item = item.duplicate!(opts)
      end
    end

    return cc unless cc.save

    # now that the card exists, we can recalculate the breadcrumb
    cc.record.recalculate_breadcrumb!
    cc.increment_card_orders! if placement != 'end'

    # if we are duplicating a submission box template,
    # the cloned template should be marked as the clone's submission_template
    if collection&.submission_box_template?
      cc.collection.parent_submission_box&.update(submission_template: cc.collection)
    end

    if parent.master_template?
      # we just added a template card, so update the instances
      parent.queue_update_template_instances
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
    amoeba_dup.tap do |card|
      # always unset this, links should not be pinned just because the original was
      card.pinned = false
    end.becomes!(CollectionCard::Link)
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

  # gets called by API collection_cards_controller
  def self.archive_all!(user_id:)
    # should only ever be used on a subset of cards, e.g. not `all`!
    unless scope_attributes['id'].present? || scope_attributes['parent_id'].present?
      return false
    end

    # capture these before `self` potentially gets altered by archive scope
    ids = pluck(:id)
    # ensure we're now working with an unscoped AR::Relation
    cards = CollectionCard.where(id: ids)
    cards.update_all(archived: true)
    # should generally only be the one parent collection, but an array to be safe
    parents = cards.map(&:parent).uniq.compact
    parents.each do |parent|
      parent.touch
      if parent.master_template?
        # we just archived a template card, so update the instances
        parent.queue_update_template_instances
      end
    end
    CollectionCardArchiveWorker.perform_async(
      ids,
      # user_id is for the archive notification `actor`
      user_id,
    )
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
    when 'Item::FileItem', 'Item::VideoItem', 'Item::LinkItem'
      return 'question_media'
    end
  end

  def update_collection_cover
    parent.cached_cover ||= {}
    if is_cover
      # A new cover was selected so turn off other covers
      parent.collection_cards.where.not(id: id).update_all(is_cover: false)
      parent.cached_cover['no_cover'] = false
    else
      # The cover was de-selected so turn off the cover on the collection
      parent.cached_cover['no_cover'] = true
    end
    parent.cache_cover!
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

  def ensure_width_and_height
    self.width = 1 if width.nil?
    self.height = 1 if height.nil?
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

  def update_parent_card_count!
    parent.cache_card_count!
  end

  def test_collection_within_master_template_after_save?
    return false if collection_id.blank? || !collection.is_a?(Collection::TestCollection)

    saved_change_to_parent_id? && master_template_card?
  end

  def set_collection_as_master_template
    collection.update(master_template: true)
  end

  def touch_collection
    return unless collection.present?

    collection.touch
  end
end
