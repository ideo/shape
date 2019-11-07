class SerializableQuestionAnswer < BaseJsonSerializer
  type 'question_answers'
  attributes(
    :answer_text,
    :answer_number,
  )

  stringified_attributes(
    :question_id,
    :idea_id,
  )

  belongs_to :survey_response
  belongs_to :question
end
