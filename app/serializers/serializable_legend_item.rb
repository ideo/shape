class SerializableLegendItem < SerializableItem
  attributes :legend_search_source, :style

  has_many :datasets do
    data do
      # NOTE: this gets all datasets if @current_user.nil so those get filtered out in cached renderer
      @object.datasets_viewable_by(@current_user)
    end
  end
end
