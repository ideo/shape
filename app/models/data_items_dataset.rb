# == Schema Information
#
# Table name: data_items_datasets
#
#  id           :bigint(8)        not null, primary key
#  order        :integer          not null
#  selected     :boolean          default(TRUE)
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  data_item_id :bigint(8)
#  dataset_id   :bigint(8)
#
# Indexes
#
#  data_items_datasets_aggregate_index                       (data_item_id,dataset_id,order,selected)
#  index_data_items_datasets_on_data_item_id_and_dataset_id  (data_item_id,dataset_id) UNIQUE
#

class DataItemsDataset < ApplicationRecord
  belongs_to :data_item, class_name: 'Item::DataItem', required: true
  belongs_to :dataset, required: true

  before_create :set_order, unless: :order?

  scope :ordered, -> { order(order: :asc) }
  scope :selected, -> { where(selected: true) }

  amoeba do
    enable

    exclude_association :data_item

    customize(lambda { |orig_data_items_dataset, dup_data_items_dataset|
      # if a dataset only has more than one data item, duplicate it
      if dup_data_items_dataset.dataset.data_items.count > 1
        new_dataset = orig_data_items_dataset.dataset.amoeba_dup
      # otherwise, just link it.
      else
        new_dataset = orig_data_items_dataset.dataset
      end
      dup_data_items_dataset.dataset = new_dataset
    })
  end

  private

  def set_order
    existing_order = DataItemsDataset.where(
      data_item_id: data_item.id,
    ).maximum(:order) || -1
    self.order = existing_order + 1
  end
end
