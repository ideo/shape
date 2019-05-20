class SerializableAdminTestCollection < SerializableSimpleCollection
  type 'collections'

  attributes :name, :test_launched_at

  has_many :test_audiences

  # TODO: Return survey response count for each audience
  attribute :num_survey_responses do
    @object.survey_responses.size
  end
end