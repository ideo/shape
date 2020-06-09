class SerializableTestAudience < BaseJsonSerializer
  type 'test_audiences'
  attributes :sample_size, :status

  belongs_to :audience
  belongs_to :test_collection

  attribute :audience_id do
    @object.audience_id.to_s
  end

  attribute :price_per_response do
    @object.price_per_response.to_f
  end

  attribute :incentive_per_response do
    @object.incentive_per_response.to_f
  end

  attribute :num_completed_responses do
    @object.survey_responses.completed.size
  end

  attribute :name do
    @object.audience.name
  end

  attribute :audience_type do
    @object.audience.audience_type
  end
end
