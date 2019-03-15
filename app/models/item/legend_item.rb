class Item
  class LegendItem < Item
    has_many :data_items, class_name: 'Item::DataItem'

    def name
      "Compare To"
    end

    def primary_measure
      # What about data_content.datasets.map { |data| data[:name] }
      # How to reconcile datasets from three different chart types?
      data_items.map(&:d_measure).compact.uniq
    end

    def active_comparisons
      []
      # data_items
      #  .map { |item| item.data_content[:datasets] }
      #  .select { |dataset| dataset[:primary] == "true" }
    end

    # This could be its own service?
    def update_active_comparisons(active_comparisons)
      # for each dataset
      # update their data_content/datasets
      # setting requested comparisons to be active
    end
  end
end
