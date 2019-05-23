class DataItemsDataset < ApplicationRecord
  belongs_to :data_item, class_name: 'Item::DataItem', required: true
  belongs_to :dataset, required: true

  before_create :set_order, unless: :order?

  scope :ordered, -> { order(order: :asc) }
  scope :selected, -> { where(selected: true) }

  private

  def set_order
    existing_order = DataItemsDataset.where(
      data_item_id: data_item.id,
    ).maximum(:order) || -1
    self.order = existing_order + 1
  end
end
