class SerializableDataItem < SerializableItem
  attributes :data_settings,
             :datasets,
             :report_type

  # Don't `data_content` as this duplicates `datasets` for DataItem
  attribute :data_content do
    nil
  end
end
