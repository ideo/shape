class Collection < ApplicationRecord
  include Breadcrumbable
  include Archivable
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

  scope :root, -> { where.not(organization_id: nil) }
  scope :not_custom_type, -> { where(type: nil) }
  scope :user, -> { where(type: 'Collection::UserCollection') }
  scope :shared_with_me, -> { where(type: 'Collection::SharedWithMeCollection') }

  validates :name, presence: true, if: :base_collection_type?
  validates :organization, presence: true, if: :parent_collection_card_blank?
  validates :parent_collection_card, presence: true, if: :organization_blank?

  accepts_nested_attributes_for :collection_cards

  def parent
    return parent_collection_card.parent if parent_collection_card.present?

    organization
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

  def editors
    User.with_role(Role::EDITOR, becomes(Collection))
  end

  def viewers
    User.with_role(Role::VIEWER, becomes(Collection))
  end

  def breadcrumb_title
    name
  end

  private

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
