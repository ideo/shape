class Item < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable
  include HasFilestackFile

  resourceable roles: [Role::EDITOR, Role::VIEWER],
               edit_role: Role::EDITOR,
               view_role: Role::VIEWER

  archivable as: :parent_collection_card,
             with: %i[reference_collection_cards]

  acts_as_taggable

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
  before_create :generate_name, unless: :name?

  validates :type, presence: true

  after_commit :reindex_parent_collection

  def reindex_parent_collection
    return unless parent.present?
    parent.reindex if Searchkick.callbacks?
  end

  amoeba do
    enable
    exclude_association :tags
    exclude_association :taggings
    exclude_association :tag_taggings
    exclude_association :filestack_file
    exclude_association :parent_collection_card
  end

  def children
    []
  end

  def duplicate!(for_user:, copy_parent_card: false)
    # Clones item
    i = amoeba_dup
    i.cloned_from = self
    i.tag_list = tag_list

    # save the dupe item first so that we can reference it later
    # return if it didn't work for whatever reason
    return i unless i.save
    i.parent_collection_card.save if i.parent_collection_card.present?

    # Clone parent + increase order
    if copy_parent_card && parent_collection_card.present?
      i.parent_collection_card = parent_collection_card.duplicate!(
        for_user: for_user,
        shallow: true,
      )
      i.parent_collection_card.item = i
    end

    roles.each do |role|
      i.roles << role.duplicate!(assign_resource: i)
    end

    # Method from HasFilestackFile
    filestack_file_duplicate!(i)

    i.reload
  end

  def breadcrumb_title
    name
  end

  def resourceable_class
    # Use top-level class since this is an STI model
    Item
  end

  def image_url
    # overridden by VideoItem / ImageItem
    nil
  end

  def generate_name
    # overridden by TextItem / ImageItem
    true
  end

  def truncate_name
    self.name = name.truncate(40, separator: /[,?\.\s]+/, omission: '')
  end

  private

  def format_url
    return if url.blank?

    # Remove spaces
    url.strip!
  end
end
