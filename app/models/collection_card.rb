class CollectionCard < ApplicationRecord
  belongs_to :parent, class_name: 'Collection'
  belongs_to :collection, optional: true
  belongs_to :item, optional: true

  validates :parent, :order, presence: true
  validate :single_item_or_collection_is_present

  scope :not_reference, -> { where(reference: false) }
  scope :reference, -> { where(reference: true) }

  private

  def single_item_or_collection_is_present
    return unless item.present? && collection.present?

    errors.add(:base, 'must have only one of Item or Collection assigned')
  end
end
