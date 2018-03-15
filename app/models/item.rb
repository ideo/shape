class Item < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable

  resourceable roles: %i[editor viewer]

  archivable as: :parent_collection_card,
             with: %i[reference_collection_cards]

  belongs_to :filestack_file, dependent: :destroy, optional: true

  # The primary collection that 'owns' this item
  has_one :parent_collection_card,
          -> { primary },
          class_name: 'CollectionCard',
          inverse_of: :item

  # All collection cards this is linked to
  has_many :reference_collection_cards,
           -> { reference },
           class_name: 'CollectionCard',
           inverse_of: :referenced_item

  delegate :parent, to: :parent_collection_card, allow_nil: true
  belongs_to :cloned_from, class_name: 'Item', optional: true

  before_validation :format_url, if: :saved_change_to_url?
  validates :type, presence: true

  accepts_nested_attributes_for :filestack_file

  after_commit :reindex_parent_collection

  def reindex_parent_collection
    return unless parent.present?
    parent.reindex
  end

  amoeba do
    enable
    exclude_association :filestack_file
    exclude_association :parent_collection_card
  end

  def duplicate!(copy_parent_card: false)
    # Clones item
    i = amoeba_dup
    i.cloned_from = self

    # Clone parent + increase order
    if copy_parent_card && parent_collection_card.present?
      i.parent_collection_card = parent_collection_card.duplicate!(shallow: true)
      i.parent_collection_card.item = i
    end

    if filestack_file.present?
      i.filestack_file = filestack_file.duplicate!
    end

    if i.save && i.parent_collection_card.present?
      i.parent_collection_card.save
    end

    i
  end

  def breadcrumb_title
    name
  end

  private

  def format_url
    return if url.blank?

    # Remove spaces
    url.strip!
  end
end
