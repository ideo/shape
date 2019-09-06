class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes :identifier, :timeframe, :measure, :name,
             :max_domain, :question_type,
             :total, :data, :single_value,
             :order, :selected,
             :data_items_datasets_id,
             :test_collection_id,
             :data_source_id, :data_source_type, :groupings, :tiers

  belongs_to :data_source

  attribute :chart_type do
    if @object.order.blank? || @object.order.zero?
      @object.chart_type
    else
      # For C∆ charts - if there's more than one chart,
      # force secondary charts to be line type chart
      'line'
    end
  end

  attribute :style do
    if @object.order.blank? || @object.order.zero? || @object.style.blank?
      @object.style
    else
      @object.style.symbolize_keys.merge(
        fill: '#000000',
      )
    end
  end
end
