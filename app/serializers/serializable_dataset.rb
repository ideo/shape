class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes(
    :chart_type, # see below TODO
    :identifier,
    :timeframe,
    :measure,
    :name,
    :max_domain,
    :question_type,
    :total,
    :data,
    :single_value,
    :order,
    :selected,
    :data_items_datasets_id,
    :test_collection_id,
    :data_source_id,
    :data_source_type,
    :groupings,
    :tiers,
  )

  belongs_to :data_source

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
