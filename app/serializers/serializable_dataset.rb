class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes :identifier, :chart_type, :timeframe, :measure, :name,
             :max_domain, :question_type,
             :total, :data, :single_value,
             :order, :selected, :style,
             :data_items_datasets_id,
             :test_collection_id,
             :data_source_id, :data_source_type, :groupings, :tiers

  belongs_to :data_source
end
