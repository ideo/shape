class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes :measure, :chart_type, :timeframe,
             :max_domain, :question_type,
             :total, :data
end
