class Item
  class LegendItem < Item
    has_many :data_items, class_name: 'Item::DataItem', inverse_of: :legend_item

    store_accessor :data_settings,
                   :selected_measures

    before_save :set_default_selected_measures

    def name
      'Compare To'
    end

    def primary_measure
      return if primary_datasets.blank?
      sample_dataset = primary_datasets.first
      {
        measure: sample_dataset[:measure],
        style: sample_dataset[:style],
      }
    end

    # Comparisons are non-primary measures from all linked datasets
    def comparison_measures
      non_primary_datasets
        .each_with_object({}) do |dataset, h|
          next if h[dataset[:measure]].present?
          h[dataset[:measure]] = {
            measure: dataset[:measure],
            style: dataset[:style],
          }
        end.values
    end

    private

    def primary_datasets
      datasets.select { |dataset| dataset[:order].zero? }
    end

    def non_primary_datasets
      datasets.reject { |dataset| dataset[:order].zero? }
    end

    def datasets
      @datasets ||= data_items.map(&:all_datasets).flatten
    end

    def set_default_selected_measures
      self.selected_measures ||= []
    end
  end
end
