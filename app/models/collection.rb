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

  has_many :collection_cards, foreign_key: :parent_id
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

  belongs_to :organization, optional: true
  belongs_to :cloned_from, class_name: 'Collection', optional: true

  after_create :inherit_roles_from_parent

  validates :name, presence: true, if: :base_collection_type?
  validates :organization, presence: true, if: :parent_collection_card_blank?
  validates :parent_collection_card, presence: true, if: :organization_blank?

  scope :root, -> { where.not(organization_id: nil) }
  scope :not_custom_type, -> { where(type: nil) }
  scope :user, -> { where(type: 'Collection::UserCollection') }
  scope :shared_with_me, -> { where(type: 'Collection::SharedWithMeCollection') }

  accepts_nested_attributes_for :collection_cards

  amoeba do
    enable
    exclude_association :collection_cards
    exclude_association :items
    exclude_association :collections
    exclude_association :parent_collection_card
  end

  def duplicate!(copy_parent_card: false)
    # Clones collection and all embedded items/collections
    c = amoeba_dup

    if copy_parent_card && parent_collection_card.present?
      c.parent_collection_card = parent_collection_card.duplicate!(shallow: true)
      c.parent_collection_card.collection = c
    end

    collection_cards.each do |collection_card|
      c.collection_cards << collection_card.duplicate!
    end

    if c.save && c.parent_collection_card.present?
      c.parent_collection_card.save
    end

    c
  end

  def parent
    return parent_collection_card.parent if parent_collection_card.present?

    organization
  end

  def children
    (items + collections)
  end

  def subcollection?
    organization.blank?
  end

  def searchable?
    true
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

  private

  def inherit_roles_from_parent
    AddRolesToChildrenWorker.perform_async(role_ids, id, self.class.name.to_s)
  end

  def organization_blank?
    organization.blank?
  end

  def parent_collection_card_blank?
    parent_collection_card.blank?
  end

  def base_collection_type?
    type.to_s == 'Collection'
  end
end
