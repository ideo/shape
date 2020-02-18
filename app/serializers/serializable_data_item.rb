class SerializableDataItem < SerializableItem
  attributes :data_settings, :report_type, :title, :description, :style

  has_many :datasets do
    data do
      []
    end
  end
end
