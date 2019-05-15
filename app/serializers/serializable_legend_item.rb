class SerializableLegendItem < SerializableItem
  has_many :datasets do
    data do
      deduped_datasets = @object.data_items_datasets.uniq do |data_items_datasets|
        dataset = data_items_datasets.dataset
        "#{dataset.data_source_type}-#{dataset.data_source_id}"
      end
      deduped_datasets.map do |data_items_datasets|
        dataset = data_items_datasets.dataset
        dataset.cached_data_items_datasets = data_items_datasets
        dataset
      end.uniq
    end
  end
end
