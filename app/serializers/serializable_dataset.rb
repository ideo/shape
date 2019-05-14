class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes :chart_type, :timeframe,
             :max_domain, :question_type,
             :total, :data

  attribute :measure do
    if @object.is_a?(DataItem::OrgWideQuestion)
      @object.measure(organization: @collection&.organization)
    else
      @object.measure
    end
  end

  has_many :data_items_datasets
end
