# == Schema Information
#
# Table name: items
#
#  id                         :bigint(8)        not null, primary key
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  content                    :text
#  data_content               :jsonb
#  data_settings              :jsonb
#  data_source_type           :string
#  icon_url                   :string
#  legend_search_source       :integer
#  name                       :string
#  question_type              :integer
#  report_type                :integer
#  style                      :jsonb
#  thumbnail_url              :string
#  type                       :string
#  unarchived_at              :datetime
#  url                        :string
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  cloned_from_id             :bigint(8)
#  data_source_id             :bigint(8)
#  filestack_file_id          :integer
#  legend_item_id             :integer
#  roles_anchor_collection_id :bigint(8)
#
# Indexes
#
#  index_items_on_archive_batch                        (archive_batch)
#  index_items_on_breadcrumb                           (breadcrumb) USING gin
#  index_items_on_cloned_from_id                       (cloned_from_id)
#  index_items_on_created_at                           (created_at)
#  index_items_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_items_on_question_type                        (question_type)
#  index_items_on_roles_anchor_collection_id           (roles_anchor_collection_id)
#  index_items_on_type                                 (type)
#

class Item < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable
  include HasFilestackFile
  include RealtimeEditorsViewers
  include HasActivities
  include Externalizable
  include Commentable
  include Globalizable

  resourceable roles: [Role::EDITOR, Role::CONTENT_EDITOR, Role::VIEWER],
               edit_role: Role::EDITOR,
               content_edit_role: Role::CONTENT_EDITOR,
               view_role: Role::VIEWER

  archivable as: :parent_collection_card,
             with: %i[cards_linked_to_this_item]

  acts_as_taggable

  translates_custom :translated_name,
                    :translated_content,
                    :translated_data_content,
                    confirmable: true,
                    fallbacks_for_empty_translations: true
  # has to come after `translates_custom`
  include Translatable

  store_accessor :cached_attributes,
                 :cached_tag_list,
                 :previous_thumbnail_urls,
                 :cached_inheritance,
                 :pending_transcoding_uuid,
                 :common_viewable

  store_accessor :data_content,
                 :ops,
                 :version,
                 :last_10

  # So that we can assign these params in collection card builder
  # We have assignment logic instead of using nested attributes
  attr_accessor :datasets_attributes, :data_items_datasets_attributes

  # The card that 'holds' this item and determines its breadcrumb
  has_one :parent_collection_card,
          class_name: 'CollectionCard::Primary',
          inverse_of: :item,
          dependent: :destroy

  has_many :cards_linked_to_this_item,
           class_name: 'CollectionCard::Link',
           inverse_of: :item,
           dependent: :destroy

  # Intentionally scoping so all non-data-items return no DataItemsDatasets
  has_many :data_items_datasets,
           -> { none },
           foreign_key: 'data_item_id'

  has_one :question_item, class_name: 'Item::QuestionItem'
  has_one :test_results_collection,
          class_name: 'Collection::TestResultsCollection',
          inverse_of: :idea,
          foreign_key: :idea_id

  delegate :parent, :pinned, :pinned?, :pinned_and_locked?,
           to: :parent_collection_card, allow_nil: true
  delegate :organization, to: :parent, allow_nil: true
  belongs_to :cloned_from, class_name: 'Item', optional: true

  scope :questions, -> { where(type: 'Item::QuestionItem') }
  scope :data_items, -> { where(type: 'Item::DataItem') }
  scope :legend_items, -> { where(type: 'Item::LegendItem') }

  before_validation :format_url, if: :saved_change_to_url?
  before_create :generate_name, unless: :name_present?

  validates :type, presence: true

  before_save :cache_attributes
  before_update :cache_previous_thumbnail_url, if: :will_save_change_to_thumbnail_url?
  after_commit :touch_related_cards, if: :saved_change_to_updated_at?, unless: :destroyed?
  after_commit :reindex_parent_collection, unless: :destroyed?
  after_commit :update_parent_collection_if_needed, unless: :destroyed?

  # declared in Item so that media (e.g. Files/Links) can utilize this
  enum question_type: {
    question_context: 0,
    question_useful: 1,
    question_open: 2,
    question_media: 4,
    question_description: 5,
    question_finish: 6,
    question_clarity: 7,
    question_excitement: 8,
    question_different: 9,
    question_category_satisfaction: 10,
    question_idea: 11,
  }

  scope :in_ideas_section, -> {
    joins(:primary_collection_cards)
      .merge(CollectionCard.section_types[:ideas])
  }

  amoeba do
    enable
    recognize []
    propagate
    nullify :breadcrumb
  end

  # Searchkick Config
  # Use queue to bulk reindex every 1m (with Sidekiq Scheduled Job/ActiveJob)
  searchkick callbacks: :queue

  # active == don't index archived items
  scope :search_import, -> do
    includes(
      :tags,
      parent_collection_card: :parent,
    )
  end

  def self.dataset_display_name
    'Idea'
  end

  def anyone_can_view?
    false
  end

  def search_content
    text = []
    case self
    when Item::TextItem
      text << plain_content
    when Item::FileItem
      text << filestack_file.filename if filestack_file.present?
    else
      text << content
    end
    text.join(' ')
  end

  def search_data
    {
      name: name,
      tags: tags.map(&:name).map(&:downcase),
      content: search_content,
      # NOTE: could change this back to defer to parent if we ever remove item roles
      user_ids: search_user_ids,
      parent_id: parent&.id,
      group_ids: search_group_ids,
      organization_id: organization_id,
      archived: archived,
    }
  end

  # just for reindexing, you can call:
  # Item.reindex(:new_search_data) to only reindex those fields (more efficiently)
  def new_search_data
    {
      tags: tags.map(&:name).map(&:downcase),
      archived: archived,
    }
  end

  # this is utilized by DataReport when we set up temp items to know their organization_id
  attr_writer :organization_id
  def organization_id
    # NOTE: this will have to lookup via collection_card -> parent
    @organization_id ||= try(:parent).try(:organization_id)
  end

  def children
    []
  end

  def duplicate!(
    for_user: nil,
    copy_parent_card: false,
    parent: self.parent,
    system_collection: false,
    synchronous: false
  )
    # Clones item
    i = amoeba_dup
    i.cloned_from = self
    i.tag_list = tag_list
    # copy roles from parent (i.e. where it's being placed)
    i.roles_anchor_collection_id = parent.roles_anchor.id

    # save the dupe item first so that we can reference it later
    # return if it didn't work for whatever reason
    return i unless i.save

    i.parent_collection_card.save if i.parent_collection_card.present?

    # Clone parent + increase order
    if copy_parent_card && parent_collection_card.present?
      i.parent_collection_card = parent_collection_card.duplicate!(
        for_user: for_user,
        shallow: true,
        parent: parent,
        system_collection: system_collection,
        synchronous: synchronous,
      )
      i.parent_collection_card.item = i
    end

    # Method from Externalizable
    duplicate_external_records(i)

    # Method from HasFilestackFile
    filestack_file_duplicate!(i)

    i.reload
    # Ran into a bug on duplication that parent reindexing failed,
    # So stopping that for now
    i.dont_reindex_parent!
    i
  end

  def breadcrumb_title
    name
  end

  def resourceable_class
    # Use top-level class since this is an STI model
    Item
  end

  def image_url
    # overridden by VideoItem / FileItem
    nil
  end

  def generate_name
    # overridden by TextItem / FileItem
    true
  end

  def truncate_name
    self.name = name ? name.truncate(40, separator: /[,?\.\s]+/, omission: '') : 'item'
  end

  def dont_reindex_parent!
    @dont_reindex_parent = true
  end

  def update_parent_collection_if_needed
    return if destroyed?

    collection = try(:parent)
    collection.touch if collection && saved_change_to_updated_at?
    return unless collection.present? && collection.cached_cover.present?
    # currently text item is the only one that matters
    return unless id == collection.cached_cover['item_id_text']

    collection.update_cover_text!(self)
  end

  def cache_attributes
    if cached_tag_list != tag_list
      self.cached_tag_list = tag_list
    end
    cached_attributes
  end

  def touch_related_cards
    try(:parent_collection_card).try(:touch)
    cards_linked_to_this_item.update_all(updated_at: updated_at)
  end

  def replaced_media?
    templated_from_item = try(:parent_collection_card).try(:templated_from).try(:item)
    return true unless templated_from_item.present?
    return false if image_url.nil? || image_url.include?('avatars/missing')

    templated_from_item.image_url != image_url
  end

  def chart_data
    {}
  end

  def data
    {}
  end

  def question_title; end

  def question_description; end

  def question_choices; end

  def jsonapi_type_name
    'items'
  end

  def default_group_id
    return self[:default_group_id] if self[:default_group_id].present? || roles_anchor == self

    roles_anchor&.default_group_id
  end

  def quill_data; end

  # So that regular items can respond when working with test collection media items
  def scale_question?
    false
  end

  def question_item_incomplete?
    return true if (
      question_category_satisfaction? || question_description? || question_open?
    ) && content.blank?

    # All other scale questions are valid without anything filled in
    return false if scale_question?

    # Media items are always transformed to other item types
    return true if question_media? && is_a?(Item::QuestionItem)

    return true if question_idea? && (
      is_a?(Item::QuestionItem) || name.blank? || content.blank?
    )

    # Question cards that are in the blank default state
    return true if question_type.blank? && filestack_file_id.blank? && url.blank?

    false
  end

  def incomplete_description
    if question_category_satisfaction?
      'your category'
    elsif question_description?
      'your description'
    elsif question_open?
      'your open response'
    elsif question_media?
      'an image or video'
    elsif question_idea?
      'your content'
    end
  end

  private

  def name_present?
    name.present?
  end

  def reindex_parent_collection
    return if @dont_reindex_parent || !Searchkick.callbacks? || parent.blank?

    parent.reindex
  end

  def format_url
    return if url.blank?

    # Remove spaces
    url.strip!
  end

  def cache_previous_thumbnail_url
    thumbs = previous_thumbnail_urls || []
    thumbs.unshift(thumbnail_url_was)
    self.previous_thumbnail_urls = thumbs.reject(&:blank?).uniq.slice(0, 9)
  end
end
