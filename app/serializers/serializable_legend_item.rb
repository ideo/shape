class SerializableLegendItem < SerializableItem
  attributes :primary_measure,
             :comparison_measures

  attribute :data_settings do
    settings = @object.data_settings&.symbolize_keys
    settings ||= {}
    settings[:selected_measures] ||= []
    settings
  end
end
