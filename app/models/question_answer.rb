class QuestionAnswer < ApplicationRecord
  belongs_to :survey_response
  belongs_to :question, class_name: 'Item::QuestionItem'

  after_commit :update_survey_response, on: %i[create destroy]

  private

  def update_survey_response
    survey_response.question_answer_created_or_destroyed
  end
end
