class Api::V1::QuestionAnswersController < Api::V1::BaseController
  deserializable_resource :question_answer, class: DeserializableQuestionAnswer, only: :create

  load_resource :question_answer, only: :create
  def create
    if @question_answer.save
      render jsonapi: @question_answer
    else
      render_api_errors @question_answer.errors
    end
  end

  def question_answer_params
    params.require(:question_answer).permit(
      :answer_text,
      :answer_number,
      :survey_response_id,
      :question_id,
    )
  end
end
