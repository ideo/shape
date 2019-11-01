class Api::V1::QuestionChoicesController < Api::V1::BaseController
  deserializable_resource :question_choice, class: DeserializableQuestionChoice, only: %i[update]
  load_and_authorize_resource :question_choice, only: %i[update]

  def update
    @question_choice.attributes = question_choice_params
    if @question_choice.save
      render jsonapi: @question_choice
    else
      render_api_errors @question_choice.errors
    end
  end


  private

  def question_choice_params
    params.require(:question_choice).permit(
      :text,
      :order,
      :archived
    )
  end
end
