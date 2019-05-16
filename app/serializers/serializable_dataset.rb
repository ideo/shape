class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes :chart_type, :timeframe, :measure,
             :max_domain, :question_type,
             :total, :data, :single_value,
             :order, :selected, :style,
             :data_items_datasets_id,
             :test_collection_id
end
