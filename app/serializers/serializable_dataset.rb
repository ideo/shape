class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes :chart_type, :timeframe,
             :max_domain, :question_type,
             :total, :data, :single_value,
             :order, :selected, :style,
             :data_items_datasets_id,
             :test_collection_id

  attribute :measure do
    if @object.is_a?(Dataset::OrgWideQuestion)
      @object.measure(organization: @collection&.organization)
    else
      @object.measure
    end
  end
end
