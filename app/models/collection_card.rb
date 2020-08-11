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
#  font_background   :boolean          default(FALSE)
#  font_color        :string
#  height            :integer          default(1)
#  hidden            :boolean          default(FALSE)
#  identifier        :string
#  image_contain     :boolean          default(FALSE)
#  is_background     :boolean          default(FALSE)
#  is_cover          :boolean          default(FALSE)
#  order             :integer
#  parent_snapshot   :jsonb
#  pinned            :boolean          default(FALSE)
#  row               :integer
#  section_type      :integer
#  show_replace      :boolean          default(TRUE)
#  type              :string
#  unarchived_at     :datetime
#  width             :integer          default(1)
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  collection_id     :bigint(8)
#  item_id           :bigint(8)
#  parent_id         :bigint(8)
#  templated_from_id :integer
#
# Indexes
#
#  index_collection_cards_on_archive_batch             (archive_batch)
#  index_collection_cards_on_collection_id             (collection_id)
#  index_collection_cards_on_identifier_and_parent_id  (identifier,parent_id)
#  index_collection_cards_on_item_id                   (item_id)
#  index_collection_cards_on_order_and_row_and_col     (order,row,col)
#  index_collection_cards_on_parent_id                 (parent_id)
#  index_collection_cards_on_templated_from_id         (templated_from_id)
#  index_collection_cards_on_type                      (type)
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
  # for the purpose of accepting these params via deserializable
  attr_accessor :external_id
  attr_accessor :card_type
  # for test survey
  attr_accessor :idea_id

  before_validation :assign_order, if: :assign_order?
  before_validation :ensure_width_and_height

  before_create :assign_default_height_and_width
  after_update :update_collection_cover, if: :saved_change_to_is_cover?
  after_update :touch_collection, if: :saved_change_to_filter?
  after_create :update_parent_card_count!
  after_save :update_collection_background, if: :saved_change_to_is_background?
  after_save :set_collection_as_master_template,
             if: :test_collection_within_master_template_after_save?

  validates :parent, :order, presence: true
  validate :single_item_or_collection_is_present
  validate :parent_is_not_readonly, on: :create
  validates :section_type, presence: true, if: :parent_test_collection?

  delegate :board_collection?, :test_collection?,
           to: :parent,
           prefix: true,
           allow_nil: true

  delegate :can_edit?,
           :can_edit_content?,
           :can_view?,
           :name,
           to: :record,
           allow_nil: true

  scope :ordered, -> { order(order: :asc, row: :asc, col: :asc) }
  scope :ordered_row_col, -> { reorder(row: :asc, col: :asc) }
  scope :pinned, -> { where(pinned: true) }
  scope :unpinned, -> { where(pinned: false) }
  scope :visible, -> { where(hidden: false) }
  scope :hidden, -> { where(hidden: true) }
  scope :is_cover, -> { where(is_cover: true) }
  scope :primary, -> { where(type: 'CollectionCard::Primary') }
  scope :link, -> { where(type: 'CollectionCard::Link') }
  scope :not_placeholder, -> { where.not(type: 'CollectionCard::Placeholder') }
  scope :ideas_collection_card, -> { where(section_type: :ideas).where.not(collection_id: nil) }
  # this scope orders by identifier because the default order(:id) is very slow when getting .first
  scope :identifier, ->(identifier) { where(identifier: identifier).order(:identifier) }
  scope :item, -> { where.not(item_id: nil) }
  scope :collection, -> { where.not(collection_id: nil) }

  enum filter: {
    nothing: 0,
    transparent_gray: 1,
  }

  enum section_type: {
    # for test collections
    intro: 0,
    ideas: 1,
    outro: 2,
    custom: 3,
    # for collection style settings
    cover: 4,
    background: 5,
  }, _prefix: true

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
      record: [
        :filestack_file,
        :datasets,
        :translations,
        :parent_collection_card,
        :question_choices,
        :collection_cover_text_items,
        :tagged_users,
        collection_cover_items: :datasets,
      ],
    ]
  end

  def self.default_includes_for_api
    {
      collection: [:collection_cover_items, :tagged_users],
      item: [
        :filestack_file,
        :tagged_users,
        data_items_datasets: [:dataset],
      ],
    }
  end

  def duplicate!(
    for_user: nil,
    parent: self.parent,
    shallow: false,
    placement: 'end',
    building_template_instance: false,
    system_collection: false,
    synchronous: false,
    placeholder: nil,
    batch_id: nil
  )
    if record.is_a? Collection::SharedWithMeCollection
      errors.add(:collection, 'cannot be a SharedWithMeCollection for duplication')
      return self
    end
    cc = placeholder || amoeba_dup
    if placeholder
      cc = cc.becomes(CollectionCard::Primary)
      # Note: when a user explicitly selects a link card to be duplicated
      # (versus it being in a sub-collection), we will duplicate the underlying record,
      # which is why placeholders are always turned into primary collection cards
      cc.type = 'CollectionCard::Primary'
      # nullify these
      cc.item_id = nil
      cc.collection_id = nil
    end
    if master_template_card? && parent.templated? && building_template_instance
      # if we're cloning from template -> templated collection
      cc.templated_from = self
    end
    # defaults to self.parent, unless one is passed in
    cc.parent = parent
    # place card at beginning or end
    if placement == 'beginning'
      if parent.templated?
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

    # If there is already a collection card is the cover,
    # don't set this duplicated card as the cover
    if parent.collection_cards.is_cover.where.not(id: cc.id).count.positive?
      cc.is_cover = false
    end

    unless shallow || link?
      opts = {
        for_user: for_user,
        parent: parent,
        system_collection: system_collection,
        synchronous: synchronous,
        batch_id: batch_id,
        card: cc,
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
    cc.record.recalculate_breadcrumb! unless shallow || link?
    cc.increment_card_orders! if placement != 'end' && placeholder.nil?

    # if we are duplicating a submission box template,
    # the cloned template should be marked as the clone's submission_template
    if collection&.submission_box_template?
      cc.collection.parent_submission_box&.update(submission_template: cc.collection)
    end

    if parent.master_template?
      # we just added a template card, so update the instances
      parent.queue_update_template_instances(
        updated_card_ids: [cc.id],
        template_update_action: :duplicate,
      )
    end

    if batch_id.present?
      # Map what card this was duplicated to so we can later re-map
      # things like link cards and search filters
      CardDuplicatorMapper::Base.new(
        batch_id: batch_id,
      ).register_duplicated_card(
        original_card_id: id,
        to_card_id: cc.id,
      )
    end

    cc
  end

  # The attributes to copy when making a link card
  def link_card_copy_attributes
    {
      image_contain: image_contain,
      font_background: font_background,
      font_color: font_color,
      filter: filter,
      show_replace: show_replace,
    }
  end

  def record
    return item if item.present?
    return collection if collection.present?
  end

  def record=(record)
    if record.is_a?(Item)
      self.item = record
      self.collection = nil
    elsif record.is_a?(Collection)
      self.collection = record
      self.item = nil
    end
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

  def placeholder?
    is_a? CollectionCard::Placeholder
  end

  def master_template_card?
    # does this card live in a MasterTemplate?
    parent&.master_template?
  end

  def ideas_collection_card?
    section_type_ideas? && collection_id.present?
  end

  def pinned_and_locked?
    pinned? && !master_template_card?
  end

  def bct_placeholder?
    is_a?(CollectionCard::Placeholder) && parent_snapshot.present?
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

  def move_to_order(to_order)
    increment_card_orders!(to_order)
    update(order: to_order)
    parent.reorder_cards!
  end

  # gets called by API collection_cards_controller
  def self.archive_all!(ids:, user_id:)
    cards = CollectionCard.where(id: ids)
    cards.update_all(archived: true, updated_at: Time.current)
    # should generally only be the one parent collection, but an array to be safe
    parents = cards.map(&:parent).uniq.compact
    parents.each do |parent|
      parent.touch
      next unless parent.master_template?

      # we just archived a template card, so update the instances
      parent.queue_update_template_instances(
        updated_card_ids: ids,
        template_update_action: :archive,
      )
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

    if collection.present? &&
       collection.is_a?(Collection::TestCollection) &&
       collection.inside_a_submission_box_template? &&
       collection.live?
      # close the submission template test if you archive it
      collection.close!
    end
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
    return 'ideas_collection' if section_type.to_s == 'ideas' && collection_id.present?

    item&.question_type
  end

  def update_collection_cover
    # don't makes any updates if going from nil to false
    return if is_cover_previous_change == [nil, false]

    parent.cached_cover ||= {}
    if is_cover
      # A new cover was selected so turn off other covers
      parent.collection_cards.where.not(id: id).update_all(is_cover: false)
      parent.cached_cover['no_cover'] = false
    elsif is_cover == false
      # The cover was de-selected so turn off the cover on the collection
      parent.cached_cover['no_cover'] = true
    end
    parent.cache_cover!
  end

  def update_collection_background
    if is_background?
      # A new background was selected so turn off other backgrounds
      parent.collection_cards.where.not(id: id).update_all(is_background: false)
      parent.update(background_image_url: item.image_url)
    else
      parent.update(background_image_url: nil)
    end
    # doing this to ensure cache is definitely busted
    parent.touch
  end

  # used by serializer to have multiple "versions" of a card, one per idea
  def id_with_idea_id
    idea_suffix = idea_id ? "_#{idea_id}" : ''
    "#{id}#{idea_suffix}"
  end

  def self.find_record_by_identifier(*args)
    identifier(CardIdentifier.call(*args)).first&.record
  end

  def board_placement_is_valid?
    return true if hidden?
    return true unless parent&.board_collection?

    if col.nil? || row.nil? || col.negative? || row.negative? || col >= parent.num_columns
      errors.add(:base, 'Board position is invalid')
      return false
    end

    return true if CollectionGrid::Calculator.exact_open_spot?(card: self, collection: parent)

    errors.add(:base, 'Board position is already taken')
    false
  end

  def cloned_from_id
    # if the underlying record was cloned, get the parent card of the cloned_from record
    record.cloned_from&.parent_collection_card&.id
  end

  def copy_master_card_attributes!(master)
    # the created_at check is rather arbitrary, however the point is to preserve
    # updates to cards that the master template editor is in the process of creating
    if master.pinned? || master.created_at > 2.minutes.ago
      update(
        height: master.height,
        width: master.width,
        col: master.col,
        row: master.row,
        order: master.order,
        pinned: master.pinned,
      )
    else
      # from an unpinned master_card we only copy the unpinned attr
      update(pinned: false)
    end
  end

  def cache_key
    key = [
      # no real point in trying to cache a search result with no parent card, but this allows it to work
      id || "search-result-#{record.id}",
      (updated_at || Time.current).to_f,
      ENV['HEROKU_RELEASE_VERSION'],
    ].join('--')
    "CollectionCardCache::#{key}"
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
