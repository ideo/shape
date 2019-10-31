class SerializableQuestionAnswer < BaseJsonSerializer
  type 'question_answers'
  attributes :answer_text, :answer_number, :selected_choice_ids
  attribute :question_id do
    # TODO: global stringify of _ids?
    @object.question_id.to_s
  end

  belongs_to :survey_response
  belongs_to :question
end
