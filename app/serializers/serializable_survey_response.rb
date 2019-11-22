class SerializableSurveyResponse < BaseJsonSerializer
  type 'survey_responses'
  attributes :session_uid, :user_id, :test_collection_id
  has_many :question_answers

  attribute :potential_incentive do
    @object.potential_incentive.to_f
  end
end
