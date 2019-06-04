class SerializableSurveyResponse < BaseJsonSerializer
  type 'survey_responses'
  attributes :session_uid, :user_id, :test_collection_id
  has_many :question_answers


  attribute :incentive do
    @object&.test_audience&.audience&.link_sharing? ? 0 : Shape::FEEDBACK_INCENTIVE_AMOUNT
  end
end
