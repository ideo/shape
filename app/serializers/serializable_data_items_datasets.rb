class SerializableDataItemsDataset < BaseJsonSerializer
  type 'data_items_datasets'

  belongs_to :dataset
  belongs_to :data_item
end
