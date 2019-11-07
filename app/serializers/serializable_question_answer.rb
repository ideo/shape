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

  attribute :selected_choice_ids do
    @object.selected_choice_ids.map(&:to_s)
  end

  belongs_to :survey_response
  belongs_to :question
end
