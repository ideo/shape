class Item
  class LegendItem < Item
    has_many :data_items,
             class_name: 'Item::DataItem',
             inverse_of: :legend_item

    has_many :datasets, through: :data_items

    store_accessor :data_settings,
                   :selected_measures

    before_save :set_default_selected_measures
    after_save :touch_related_collection_cards

    def name
      'Legend'
    end

    def primary_measure
      datasets_by_measure[measures.first].first
    end

    # Comparisons are non-primary measures from all linked datasets
    def comparison_measures
      measures = []
      datasets_by_measure.each_with_index do |(_measure, datasets), i|
        next if i.zero?
        measures << datasets.first
      end
      measures
    end

    def dynamic_measure_names
      {
        DataReport::QuestionItem::ORG_MEASURE_NAME => "#{organization.name} Organization",
      }
    end

    # private

    def dataset_measure_hash(dataset, order = 0)
      {
        measure: dataset.measure,
        style: dataset.try(:style),
        order: order,
        chart_type: dataset.chart_type || 'line', # Line as a fallback for C∆ charts
      }
    end

    def use_datasets?
      datasets.present?
    end

    def measures
      datasets_by_measure.keys
    end

    def datasets_by_measure
      last_measure = nil
      i = 0
      @datasets_by_measure ||= all_datasets.each_with_object({}) do |dataset, h|
        h[dataset.measure] ||= []
        h[dataset.measure] << dataset_measure_hash(dataset, i)
        i += 1 if last_measure != dataset.measure
        last_measure = dataset.measure
      end
    end

    def all_datasets
      return datasets if datasets.present?

      @all_datasets ||= data_items.map(&:all_datasets).flatten.select do |dataset|
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
