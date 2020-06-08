class SerializableDataItem < SerializableItem
  attributes :data_settings, :report_type, :title, :description, :style

  has_many :datasets do
    data do
      # omitted on purpose to be filled in async
      []
    end
  end
end
