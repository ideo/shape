class SerializableQuestionAnswer < BaseJsonSerializer
  type 'question_answers'
  attributes :survey_response_id, :question_id, :answer_text, :answer_number
  belongs_to :survey_response
  belongs_to :question
end
