class SerializableDataItem < SerializableItem
  attributes :data_settings, :report_type, :title, :description

  # Don't `data_content` as this duplicates `datasets` for DataItem
  attribute :data_content do
    nil
  end

  has_many :datasets do
    data do
      @object.data_items_datasets.map do |data_items_datasets|
        dataset = data_items_datasets.dataset
        dataset.cached_data_items_datasets = data_items_datasets
        dataset
      end
    end
  end
end
