class SerializableDataItem < SerializableItem
  attributes :data_settings, :report_type, :title, :description, :style

  # Don't `data_content` as this duplicates `datasets` for DataItem
  attribute :data_content do
    nil
  end

  has_many :datasets do
    data do
      @object.data_items_datasets.selected.map do |data_items_datasets|
        dataset = data_items_datasets.dataset
        next if dataset.blank?

        dataset.cached_data_items_datasets = data_items_datasets
        dataset
      end.compact
    end
  end
end
