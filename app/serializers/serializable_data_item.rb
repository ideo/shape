class SerializableDataItem < SerializableItem
  attributes :data_settings, :report_type, :title, :description, :style

  has_many :datasets do
    data do
      @include.present? && @include.include?('datasets') ? @object.selected_datasets : []
    end
  end
end
