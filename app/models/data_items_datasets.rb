class DataItemsDatasets < ApplicationRecord
  self.table_name = 'data_items_datasets'
  belongs_to :data_item, class_name: 'Item::DataItem'
  belongs_to :dataset

  before_create :set_order, unless: :order?

  scope :ordered, -> { order(order: :asc) }

  private

  def set_order
    existing_order = DataItemsDatasets.where(
      data_item_id: data_item.id,
    ).maximum(:order) || -1
    self.order = existing_order + 1
  end
end
