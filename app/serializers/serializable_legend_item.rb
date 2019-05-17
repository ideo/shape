class SerializableLegendItem < SerializableItem
  attribute :legend_search_source

  has_many :datasets do
    data do
      @object.data_items_datasets.map do |data_items_datasets|
        dataset = data_items_datasets.dataset
        dataset.cached_data_items_datasets = data_items_datasets
        dataset
      end.uniq
    end
  end
end
