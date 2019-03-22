class Item
  class LegendItem < Item
    has_many :data_items,
             class_name: 'Item::DataItem',
             inverse_of: :legend_item

    store_accessor :data_settings,
                   :selected_measures

    before_save :set_default_selected_measures
    after_save :touch_related_collection_cards

    def name
      'Compare To'
    end

    def primary_measure
      return if primary_datasets.blank?
      sample_dataset = primary_datasets.first
      dataset_measure_hash(sample_dataset)
    end

    # Comparisons are non-primary measures from all linked datasets
    def comparison_measures
      non_primary_datasets
        .each_with_object({}) do |dataset, h|
          next if h[dataset[:measure]].present?
          h[dataset[:measure]] = dataset_measure_hash(dataset)
        end.values
    end

    private

    def dataset_measure_hash(dataset)
      {
        measure: dataset[:measure],
        style: dataset[:style],
        order: dataset[:order],
      }
    end

    def primary_datasets
      datasets_with_data.select { |dataset| dataset[:order].zero? }
    end

    def non_primary_datasets
      datasets_with_data.reject { |dataset| dataset[:order].zero? }
    end

    def datasets_with_data
      @datasets_with_data ||= data_items.map(&:all_datasets).flatten.select do |dataset|
        dataset[:data].present? || dataset[:single_value].present?
      end
    end

    def set_default_selected_measures
      self.selected_measures ||= []
    end

    def touch_related_collection_cards
      CollectionCard::Primary
        .where(
          item_id: data_item_ids,
        ).update_all(updated_at: Time.current)
    end
  end
end
