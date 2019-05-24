class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes :chart_type, :timeframe, :measure, :name,
             :display_name, :max_domain, :question_type,
             :total, :data, :single_value,
             :order, :selected, :style,
             :data_items_datasets_id,
             :test_collection_id,
             :data_source_id, :data_source_type, :groupings

  belongs_to :data_source
end
