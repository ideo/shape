class Item < ApplicationRecord
  include Breadcrumbable
  resourcify

  belongs_to :filestack_file, dependent: :destroy, optional: true

  # The primary collection that 'owns' this item
  has_one :parent_collection_card,
          -> { not_reference },
          class_name: 'CollectionCard'

  # All collection cards this is linked to
  has_many :collection_cards, -> { reference }

  delegate :parent, to: :parent_collection_card, allow_nil: true

  before_validation :format_url, if: :url_changed?
  validates :type, presence: true

  accepts_nested_attributes_for :filestack_file

  def editors
    User.with_role(Role::EDITOR, self)
  end

  def viewers
    User.with_role(Role::VIEWER, self)
  end

  def breadcrumb_title
    name
  end

  private

  def format_url
    return if url.blank?

    # Remove spaces
    url.strip!

    # Prepend with scheme if there is none (default to https)
    uri = URI.parse(url)
    url = "https://#{url}" if uri.scheme.blank?

    self.url = url
  end
end
