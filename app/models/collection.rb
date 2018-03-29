class Collection < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable
  resourceable roles: [Role::EDITOR, Role::VIEWER],
               edit_role: Role::EDITOR,
               view_role: Role::VIEWER

  archivable as: :parent_collection_card,
             with: %i[collection_cards reference_collection_cards]
  resourcify
  acts_as_taggable

  has_many :collection_cards,
           -> { active.order(order: :asc) },
           foreign_key: :parent_id,
           dependent: :destroy
  # All collection cards this is linked to
  has_many :reference_collection_cards,
           -> { reference },
           class_name: 'CollectionCard',
           inverse_of: :referenced_collection
  has_many :items, through: :collection_cards
  has_many :collections, through: :collection_cards
  has_one :parent_collection_card,
          -> { primary },
          class_name: 'CollectionCard',
          inverse_of: :collection
  delegate :parent, to: :parent_collection_card, allow_nil: true

  belongs_to :organization, optional: true
  belongs_to :cloned_from, class_name: 'Collection', optional: true

  validates :name, presence: true, if: :base_collection_type?
  validates :organization, presence: true
  before_validation :inherit_parent_organization_id, on: :create

  scope :root, -> { where.not(organization_id: nil) }
  scope :not_custom_type, -> { where(type: nil) }
  scope :user, -> { where(type: 'Collection::UserCollection') }
  scope :shared_with_me, -> { where(type: 'Collection::SharedWithMeCollection') }

  accepts_nested_attributes_for :collection_cards

  # Searchkick config
  searchkick
  # active == don't index archived collections
  # where(type: nil) == don't index User/SharedWithMe collections
  scope :search_import, -> { active.where(type: nil).includes(%i[tags items]) }

  def search_data
    {
      name: name,
      tags: all_tag_names,
      item_tags: items.map(&:tags).flatten.map(&:name),
      content: search_content,
      organization_id: organization_id,
      user_ids: (editors[:users] + viewers[:users]).uniq,
      group_ids: (editors[:groups] + viewers[:groups]).uniq,
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

  amoeba do
    enable
    exclude_association :tags
    exclude_association :taggings
    exclude_association :tag_taggings
    exclude_association :roles
    exclude_association :collection_cards
    exclude_association :items
    exclude_association :collections
    exclude_association :parent_collection_card
  end

  def duplicate!(for_user:, copy_parent_card: false)
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
    cached_cards ||= collection_cards.includes(:items, :collections)
    cached_cards.select do |collection_card|
      collection_card.record.can_view?(user)
    end
  end

  # convenience method if card order ever gets out of sync
  def reorder_cards
    collection_cards.each_with_index do |card, i|
      card.update_attribute(:order, i)
    end
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
    if (primary = collection_cards.reject(&:reference).first)
      return primary.parent
    end
    nil
  end

  def inherit_parent_organization_id
    return true if organization.present?
    return true unless parent_collection.present?
    self.organization_id = parent_collection.organization_id
  end

  def base_collection_type?
    self.class.name == 'Collection'
  end
end
