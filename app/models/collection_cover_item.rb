class CollectionCoverItem < ApplicationRecord
  belongs_to :collection
  belongs_to :item

  before_create :set_order, unless: :order

  scope :ordered, -> { order(order: :asc) }
  scope :primary, -> { where(order: 0) }

  validates :order,
            uniqueness: {
              scope: %i[collection_id item_id],
            }

  private

  def set_order
    self.order = CollectionCoverItem.where(
      collection_id: collection_id,
      item_id: item_id,
    ).maximum(:order).to_i + 1
  end
end
