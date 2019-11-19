class SerializableSurveyResponse < BaseJsonSerializer
  type 'survey_responses'
  attributes :session_uid, :user_id, :test_collection_id, :potential_incentive
  has_many :question_answers
end
