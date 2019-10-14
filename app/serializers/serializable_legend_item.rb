class SerializableLegendItem < SerializableItem
  attributes :legend_search_source, :style

  has_many :datasets do
    data do
      @object.data_items_datasets.map do |data_items_datasets|
        dataset = data_items_datasets.dataset
        next if dataset.blank?

        dataset.cached_data_items_datasets = data_items_datasets
        dataset
      end.compact.uniq
    end
  end
end
