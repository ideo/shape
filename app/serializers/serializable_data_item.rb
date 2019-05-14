class SerializableDataItem < SerializableItem
  attributes :data_settings, :visible_datasets,
             :report_type, :title, :description

  # Don't `data_content` as this duplicates `datasets` for DataItem
  attribute :data_content do
    nil
  end

  has_many :datasets
end
