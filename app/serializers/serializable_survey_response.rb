class SerializableSurveyResponse < BaseJsonSerializer
  type 'survey_responses'
  attributes :session_uid, :user_id, :test_collection_id
  has_many :question_answers


  attribute :incentive do
    # TODO: account for test_audience with price of 0.0 (link sharing)
    # return nil if @object&.test_audience&.audience&.link_sharing?
    @object.try(:test_audience).try(:price_per_response)
  end
end
