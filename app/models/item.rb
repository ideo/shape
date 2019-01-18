class Item < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable
  include HasFilestackFile
  include RealtimeEditorsViewers
  include HasActivities

  resourceable roles: [Role::EDITOR, Role::CONTENT_EDITOR, Role::VIEWER],
               edit_role: Role::EDITOR,
               content_edit_role: Role::CONTENT_EDITOR,
               view_role: Role::VIEWER

  archivable as: :parent_collection_card,
             with: %i[cards_linked_to_this_item]
  after_archive :remove_comment_followers!

  acts_as_taggable

  store_accessor :cached_attributes,
                 :cached_tag_list,
                 :cached_filestack_file_url,
                 :cached_filestack_file_info,
                 :previous_thumbnail_urls,
                 :cached_roles_identifier

  # The card that 'holds' this item and determines its breadcrumb
  has_one :parent_collection_card,
          class_name: 'CollectionCard::Primary',
          inverse_of: :item,
          dependent: :destroy

  has_many :cards_linked_to_this_item,
           class_name: 'CollectionCard::Link',
           inverse_of: :item,
           dependent: :destroy

  delegate :parent, :pinned, :pinned?, :pinned_and_locked?,
           to: :parent_collection_card, allow_nil: true
  delegate :organization, to: :parent, allow_nil: true
  belongs_to :cloned_from, class_name: 'Item', optional: true
  has_one :comment_thread, as: :record, dependent: :destroy
  has_one :question_item, class_name: 'Item::QuestionItem'

  scope :questions, -> { where(type: 'Item::QuestionItem') }

  before_validation :format_url, if: :saved_change_to_url?
  before_create :generate_name, unless: :name_present?

  validates :type, presence: true

  before_save :cache_attributes
  before_update :cache_previous_thumbnail_url, if: :will_save_change_to_thumbnail_url?
  after_commit :touch_related_cards, if: :saved_change_to_updated_at?, unless: :destroyed?
  after_commit :reindex_parent_collection, unless: :destroyed?
  after_commit :update_parent_collection_if_needed, unless: :destroyed?

  amoeba do
    enable
    recognize []
    propagate
    nullify :breadcrumb
  end

  # Searchkick Config
  # Use queue to bulk reindex every 5m (with Sidekiq Scheduled Job/ActiveJob)
  searchkick callbacks: :queue

  # active == don't index archived items
  scope :search_import, -> do
    active.includes(
      :tags,
      :taggings,
      parent_collection_card: :parent,
    )
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
      tags: tags.map(&:name),
      content: search_content,
      # NOTE: could change this back to defer to parent if we ever remove item roles
      user_ids: search_user_ids,
      group_ids: search_group_ids,
      organization_id: organization_id,
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

  def remove_comment_followers!
    return unless comment_thread.present?
    RemoveCommentThreadFollowers.perform_async(comment_thread.id)
  end

  def touch_related_cards
    try(:parent_collection_card).try(:touch)
    cards_linked_to_this_item.update_all(updated_at: updated_at)
  end

  def chart_data
    {}
  end

  def data
    {}
  end

  def jsonapi_type_name
    'items'
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
