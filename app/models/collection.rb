class Collection < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable
  resourceable roles: [Role::EDITOR, Role::VIEWER],
               edit_role: Role::EDITOR,
               view_role: Role::VIEWER

  archivable as: :parent_collection_card,
             with: %i[collection_cards cards_linked_to_this_collection]
  acts_as_taggable

  store_accessor :cached_attributes,
                 :cached_cover, :cached_tag_list

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

  after_save :touch_related_cards, if: :saved_change_to_updated_at?

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

  delegate :parent, to: :parent_collection_card, allow_nil: true

  belongs_to :organization
  belongs_to :cloned_from, class_name: 'Collection', optional: true
  belongs_to :created_by, class_name: 'User', optional: true

  validates :name, presence: true, if: :base_collection_type?
  before_validation :inherit_parent_organization_id, on: :create
  after_commit :reindex_sync, on: :create

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
    (tag_list + items.map(&:tag_list)).uniq
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
      roles: %i[users groups],
      collection_cards: [
        :parent,
        record: %i[filestack_file],
      ],
    ]
  end

  # similar to above but requires `collection/item` instead of `record`
  def self.default_relationships_for_cache_query
    [
      # NOTE: we don't include users/groups with roles otherwise we'd have to bust the cache
      # every time any individual user/group on the role was updated
      :roles,
      collection_cards: [
        :parent,
        :collection,
        item: %i[filestack_file],
      ],
    ]
  end

  amoeba do
    enable
    exclude_association :tags
    exclude_association :taggings
    exclude_association :tag_taggings
    exclude_association :roles
    exclude_association :collection_cards
    exclude_association :all_collection_cards
    exclude_association :primary_collection_cards
    exclude_association :link_collection_cards
    exclude_association :cards_linked_to_this_collection
    exclude_association :items
    exclude_association :collections
    exclude_association :parent_collection_card
  end

  def duplicate!(for_user:, copy_parent_card: false, parent: self.parent)
    # Clones collection and all embedded items/collections
    c = amoeba_dup
    c.cloned_from = self
    c.tag_list = tag_list

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

    roles.each do |role|
      c.roles << role.duplicate!(assign_resource: c)
    end

    collection_cards.each do |collection_card|
      next unless collection_card.record.can_view?(for_user)
      collection_card.duplicate!(for_user: for_user, parent: c)
    end

    # pick up newly created relationships
    c.reload
  end

  def parent
    return parent_collection_card.parent if parent_collection_card.present?

    organization
  end

  def children
    (items + collections)
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

  def collection_cards_viewable_by(cached_cards, user)
    cached_cards ||= collection_cards.includes(:item, :collection)
    cached_cards.select do |collection_card|
      collection_card.record.can_view?(user)
    end
  end

  # convenience method if card order ever gets out of sync
  def reorder_cards!
    collection_cards.each_with_index do |card, i|
      card.update_attribute(:order, i) unless card.order == i
    end
  end

  def allow_primary_group_view_access
    return unless parent_is_user_collection?
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

  def cache_tag_list
    self.cached_tag_list = tag_list
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

  def cache_key
    "#{jsonapi_cache_key}" \
      "/cards_#{collection_cards.maximum(:updated_at).to_i}" \
      "/roles_#{roles.maximum(:updated_at).to_i}"
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

  def parent_is_user_collection?
    parent.is_a? Collection::UserCollection
  end
end
