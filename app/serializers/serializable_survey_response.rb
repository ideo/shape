class SerializableSurveyResponse < BaseJsonSerializer
  type 'survey_responses'
  attributes :session_uid
  has_many :question_answers
end
