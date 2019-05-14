class SerializableDataItemsDatasets < BaseJsonSerializer
  type 'data_items_datasets'

  belongs_to :dataset
end
