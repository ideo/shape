class Item
  class LegendItem < Item
    has_many :data_items, class_name: 'Item::DataItem'

    # TODO
    # validate :link_item_to_legend?, if: :primary_measure_matches?

    def name
      "Compare To"
    end

    def primary_measure
      primary_datasets.first[:measure]
    end

    def primary_datasets
      data_items
        .map(&:datasets)
        .flatten
        .select { |dataset| dataset[:primary] == true }
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

    private

    def link_to_legend(item)
      item.update(legend_item_id: id)
    end

    def primary_measure_matches?(item)
      dataset = item.datasets.find { |dataset| dataset[:primary] == true }
      dataset[:measure] == primary_measure
    end
  end
end
