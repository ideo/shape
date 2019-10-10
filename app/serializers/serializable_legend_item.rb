class SerializableLegendItem < SerializableItem
  attribute :legend_search_source

  has_many :datasets do
    data do
      @object.datasets_viewable_by(@current_user)
    end
  end
end
