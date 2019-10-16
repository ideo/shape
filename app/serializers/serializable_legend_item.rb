class SerializableLegendItem < SerializableItem
  attributes :legend_search_source, :style

  has_many :datasets do
    data do
      @object.datasets_viewable_by(@current_user)
    end
  end
end
