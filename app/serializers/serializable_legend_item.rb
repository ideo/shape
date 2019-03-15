class SerializableLegendItem < SerializableItem
  attribute :measure do
    @object.primary_measure
  end

  attribute :comparisons do
    @object.active_comparisons
  end
  # attributes :data_settings,
  #            :datasets,
  #            :report_type
end
