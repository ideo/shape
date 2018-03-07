class Item < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  resourceable roles: %i[editor viewer]

  belongs_to :filestack_file, dependent: :destroy, optional: true

  # The primary collection that 'owns' this item
  has_one :parent_collection_card,
          -> { primary },
          class_name: 'CollectionCard',
          inverse_of: :item

  # All collection cards this is linked to
  has_many :collection_cards, -> { reference }

  delegate :parent, to: :parent_collection_card, allow_nil: true

  before_validation :format_url, if: :saved_change_to_url?
  validates :type, presence: true

  accepts_nested_attributes_for :filestack_file

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
