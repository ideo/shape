class Collection < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable
  include HasActivities
  resourceable roles: [Role::EDITOR, Role::CONTENT_EDITOR, Role::VIEWER],
               edit_role: Role::EDITOR,
               content_edit_role: Role::CONTENT_EDITOR,
               view_role: Role::VIEWER

  archivable as: :parent_collection_card,
             with: %i[collection_cards cards_linked_to_this_collection]
  after_archive :remove_comment_followers!
  acts_as_taggable

  store_accessor :cached_attributes,
                 :cached_cover, :cached_tag_list, :cached_all_tags_list,
                 :cached_owned_tag_list,
                 :cached_org_properties

  # callbacks
  after_save :touch_related_cards, if: :saved_change_to_updated_at?
  after_commit :reindex_sync, on: :create
  after_commit :recalculate_child_breadcrumbs_async, if: :saved_change_to_name?
  after_commit :update_comment_thread_in_firestore

  # all cards including archived (i.e. undo default :collection_cards scope)
  has_many :all_collection_cards,
           class_name: 'CollectionCard',
           foreign_key: :parent_id,
           inverse_of: :parent,
           dependent: :destroy

  # all active cards including links
  # i.e. this is what is displayed in the frontend for collection.collection_cards
  has_many :collection_cards,
           -> { active.ordered },
           class_name: 'CollectionCard',
           foreign_key: :parent_id,
           inverse_of: :parent

  # cards where the item/collection "lives" in this collection
  has_many :primary_collection_cards,
           -> { active.ordered },
           class_name: 'CollectionCard::Primary',
           foreign_key: :parent_id,
           inverse_of: :parent

  # cards where the item/collection is linked into this collection
  has_many :link_collection_cards,
           -> { active.ordered },
           class_name: 'CollectionCard::Link',
           foreign_key: :parent_id,
           inverse_of: :parent

  # cards that live outside this collection, linking to this collection
  has_many :cards_linked_to_this_collection,
           class_name: 'CollectionCard::Link',
           inverse_of: :collection,
           dependent: :destroy

  # the card that represents this collection in its parent, and determines its breadcrumb
  has_one :parent_collection_card,
          class_name: 'CollectionCard::Primary',
          inverse_of: :collection,
          dependent: :destroy

  has_many :items, through: :primary_collection_cards
  has_many :collections, through: :primary_collection_cards
  has_many :items_and_linked_items,
           through: :collection_cards,
           source: :item
  has_many :collections_and_linked_collections,
           through: :collection_cards,
           source: :collection

  has_one :comment_thread, as: :record, dependent: :destroy

  delegate :parent, to: :parent_collection_card, allow_nil: true

  belongs_to :organization
  belongs_to :cloned_from, class_name: 'Collection', optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :template, class_name: 'Collection::MasterTemplate', optional: true

  validates :name, presence: true, if: :base_collection_type?
  before_validation :inherit_parent_organization_id, on: :create

  scope :root, -> { where.not(organization_id: nil) }
  scope :not_custom_type, -> { where(type: nil) }
  scope :user, -> { where(type: 'Collection::UserCollection') }
  scope :shared_with_me, -> { where(type: 'Collection::SharedWithMeCollection') }

  accepts_nested_attributes_for :collection_cards

  # Searchkick Config
  # Use queue to bulk reindex every 5m (with Sidekiq Scheduled Job/ActiveJob)
  searchkick callbacks: :queue

  # active == don't index archived collections
  # where(type: nil) == don't index User/SharedWithMe collections
  scope :search_import, -> do
    active.where(type: nil).includes(
      [
        {
          items: %i[
            tags
            taggings
          ],
        },
        :tags,
        :taggings,
      ],
    )
  end

  # By default all string fields are searchable
  def search_data
    user_ids = (editors[:users].pluck(:id) + viewers[:users].pluck(:id)).uniq
    group_ids = (editors[:groups].pluck(:id) + viewers[:groups].pluck(:id)).uniq
    {
      name: name,
      tags: all_tag_names,
      item_tags: items.map(&:tags).flatten.map(&:name),
      content: search_content,
      organization_id: organization_id,
      user_ids: user_ids,
      group_ids: group_ids,
    }
  end

  def all_tag_names
    # We include item tags because you currently can't search for items
    (all_tags_list + items.map(&:tag_list)).uniq
  end

  def search_content
    # TODO: indexing private sub-content differently?
    # Current functionality for getting a collection's searchable "text content":
    # - go through all items in the collection
    # - for TextItems, grab the first 200 characters of their content
    # - for other items (e.g. media), grab the name
    # - join it all together into one blob of text, remove non-normal characters
    items.map do |item|
      if item.is_a? Item::TextItem
        item.plain_content.truncate(200, separator: /\s/, omission: '')
      else
        item.name
      end
    end.join(' ').gsub(/[^\p{Alnum}\s]/, ' ')
  end
  # <-- End Searchkick

  # default relationships to include when rendering Collections in the API
  def self.default_relationships_for_api
    [
      :created_by,
      roles: %i[users groups resource],
      collection_cards: [
        :parent,
        record: [:filestack_file],
      ],
    ]
  end

  # similar to above but requires `collection/item` instead of `record`
  def self.default_relationships_for_query
    [
      :created_by,
      roles: %i[users groups resource],
      collection_cards: [
        :parent,
        :collection,
        item: [:filestack_file],
      ],
    ]
  end

  amoeba do
    enable
    # propagate to STI models
    propagate
    nullify :breadcrumb
    nullify :created_by_id
    nullify :organization_id
    set archived: false
    # don't recognize any relations, easiest way to turn them all off
    recognize []
  end

  def duplicate!(
    for_user:,
    copy_parent_card: false,
    parent: self.parent,
    from_template: false
  )
    # Clones collection and all embedded items/collections
    c = amoeba_dup
    c.cloned_from = self
    c.created_by = for_user
    c.tag_list = tag_list
    # copy organization_id from the collection this is being moved into
    # NOTE: parent is only nil in Colab import -- perhaps we should clean up any Colab import specific code?
    c.organization_id = parent.try(:organization_id) || organization_id

    # save the dupe collection first so that we can reference it later
    # return if it didn't work for whatever reason
    return c unless c.save
    c.parent_collection_card.save if c.parent_collection_card.present?

    if copy_parent_card && parent_collection_card.present?
      c.parent_collection_card = parent_collection_card.duplicate!(
        for_user: for_user,
        shallow: true,
        parent: parent,
      )
      c.parent_collection_card.collection = c
    end

    # copy roles from parent (i.e. where it's being placed)
    parent.roles.each do |role|
      c.roles << role.duplicate!(assign_resource: c)
    end
    # NOTE: different from `parent_is_user_collection?` since `parent` is passed in
    if parent.is_a? Collection::UserCollection
      c.allow_primary_group_view_access
    end
    # upgrade to editor unless we're setting up a templated collection
    for_user.upgrade_to_edit_role(c) unless from_template

    CollectionCardDuplicationWorker.perform_async(
      collection_cards.map(&:id),
      for_user.id,
      c.id,
    )

    # pick up newly created relationships
    c.reload
  end

  def children
    (items + collections)
  end

  def children_and_linked_children
    (items_and_linked_items + collections_and_linked_collections)
  end

  def searchable?
    true
  end

  def should_index?
    active?
  end

  def read_only?
    false
  end

  def breadcrumb_title
    name
  end

  def resourceable_class
    # Use top-level class since this is an STI model
    Collection
  end

  def recalculate_child_breadcrumbs_async
    BreadcrumbRecalculationWorker.perform_async(id)
  end

  def recalculate_child_breadcrumbs(cards = collection_cards)
    cards.each do |card|
      next if card.link?
      if card.item.present?
        # have to reload in order to pick up new parent relationship
        card.item.reload.recalculate_breadcrumb!
      elsif card.collection_id.present?
        BreadcrumbRecalculationWorker.perform_async(card.collection_id)
      end
    end
  end

  def collection_cards_viewable_by(cached_cards, user)
    cached_cards ||= collection_cards.includes(:item, :collection)
    cached_cards.select do |collection_card|
      collection_card.record.can_view?(user)
    end
  end

  # convenience method if card order ever gets out of sync
  def reorder_cards!
    all_collection_cards.active.order(pinned: :desc, order: :asc).each_with_index do |card, i|
      card.update_attribute(:order, i) unless card.order == i
    end
  end

  def reorder_cards_by_collection_name!
    all_collection_cards.active.includes(:collection).order('collections.name ASC').each_with_index do |card, i|
      card.update_attribute(:order, i) unless card.order == i
    end
  end

  def allow_primary_group_view_access
    organization.primary_group.add_role(Role::VIEWER, self)
  end

  def reindex_sync
    Searchkick.callbacks(true) do
      reindex
    end
  end

  def touch_related_cards
    try(:parent_collection_card).try(:touch)
    cards_linked_to_this_collection.update_all(updated_at: updated_at)
  end

  def owned_tag_list
    all_tags_list - tag_list
  end

  def cache_tag_list
    self.cached_tag_list = tag_list
  end

  def cache_owned_tag_list
    self.cached_owned_tag_list = owned_tag_list
  end

  def cache_all_tags_list
    self.cached_all_tags_list = all_tags_list
  end

  # these all get called from CollectionUpdater
  def update_cached_tag_lists
    cache_tag_list if tag_list != cached_tag_list
    cache_all_tags_list if all_tags_list != cached_all_tags_list
    cache_owned_tag_list if owned_tag_list != cached_owned_tag_list
  end

  def display_cover?
    # overridden in some STI classes
    true
  end

  def cache_cover
    self.cached_cover = CollectionCover.call(self)
  end

  def cache_cover!
    cache_cover
    save
  end

  def update_cover_text!(text_item)
    cached_cover['text'] = CollectionCover.cover_text(self, text_item)
    save
  end

  def base_collection_type?
    self.class.name == 'Collection'
  end

  def parent_is_user_collection?
    parent.is_a? Collection::UserCollection
  end

  def org_templates?
    false
  end

  def profiles?
    false
  end

  def profile_template?
    false
  end

  def cache_key
    "#{jsonapi_cache_key}" \
      "/cards_#{collection_cards.maximum(:updated_at).to_i}" \
      "/roles_#{roles.maximum(:updated_at).to_i}"
  end

  def remove_comment_followers!
    return unless comment_thread.present?
    RemoveCommentThreadFollowers.perform_async(comment_thread.id)
  end

  private

  def organization_blank?
    organization.blank?
  end

  def parent_collection_card_blank?
    parent_collection_card.blank?
  end

  def parent_collection
    # this first case should return e.g. when using CollectionCardBuilder
    return parent if parent_collection_card.present?
    # if the collection is in process of being built, parent_collection_card will always be nil
    # (currently mostly useful for specs, when we are creating models directly)
    if (primary = collection_cards.first)
      return primary.parent
    end
    nil
  end

  def inherit_parent_organization_id
    return true if organization.present?
    return true unless parent_collection.present?
    self.organization_id = parent_collection.organization_id
  end

  def update_comment_thread_in_firestore
    return unless comment_thread.present?
    return unless saved_change_to_name? || saved_change_to_cached_attributes?
    comment_thread.store_in_firestore
  end
end
