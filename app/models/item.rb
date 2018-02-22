class Item < ApplicationRecord
  include Breadcrumbable
  resourcify

  # The primary collection that 'owns' this item
  has_one :parent_collection_card,
          -> { primary },
          class_name: 'CollectionCard'

  # All collection cards this is linked to
  has_many :collection_cards, -> { reference }

  delegate :parent, to: :parent_collection_card, allow_nil: true

  validates :type, presence: true

  def editors
    User.with_role(Role::EDITOR, self)
  end

  def viewers
    User.with_role(Role::VIEWER, self)
  end

  def breadcrumb_title
    name
  end
end
