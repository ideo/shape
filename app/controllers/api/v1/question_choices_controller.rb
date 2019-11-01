class Api::V1::QuestionChoicesController < Api::V1::BaseController
  deserializable_resource :question_choice, class: DeserializableQuestionChoice, only: %i[update]
  load_and_authorize_resource :question_choice, only: %i[update destroy]
  before_action :load_question, only: %i[destroy create]

  def create
    next_order = @question.question_choices.count + 1
    @question_choice = QuestionChoice.new(
      order: next_order,
      text: "Option #{next_order}",
      question_item_id: @question.id,
    )
    if @question_choice.save
      render jsonapi: @question,
             include: [:question_choices]
    else
      render_api_errors @question_choice.errors
    end
  end

  def update
    @question_choice.attributes = question_choice_params
    if @question_choice.save
      render jsonapi: @question_choice
    else
      render_api_errors @question_choice.errors
    end
  end

  def destroy
    if @question_choice.destroy
      render jsonapi: @question,
             include: [:question_choices]
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

  def load_question
    @question = Item::QuestionItem.find(params[:item_id])
  end
end
