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
  after_commit :inherit_roles_from_parent, on: :create

  validates :type, presence: true

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

  def children
    []
  end

  def duplicate!(for_user:, copy_parent_card: false)
    # Clones item
    i = amoeba_dup
    i.cloned_from = self

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

    if i.save && i.parent_collection_card.present?
      i.parent_collection_card.save
    end

    i
  end

  def breadcrumb_title
    name
  end

  def resourceable_class
    # Use top-level class since this is an STI model
    Item
  end

  def name
    return read_attribute(:name) if read_attribute(:name).present?
    return if filestack_file.blank?
    filestack_file.filename_without_extension
  end

  private

  def inherit_roles_from_parent
    AddRolesToChildrenWorker.perform_async(role_ids, id, self.class.name.to_s)
  end

  def format_url
    return if url.blank?

    # Remove spaces
    url.strip!
  end
end
