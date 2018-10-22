class Api::V1::SurveyResponsesController < Api::V1::BaseController
  skip_before_action :check_api_authentication!
  # deserializable_resource :survey_response, class: DeserializableSurveyResponse, only: %i[create]
  before_action :load_test_collection, only: %i[create]

  before_action :load_and_authorize_survey_response, only: %i[show]
  def show
    render jsonapi: @survey_response, include: %i[question_answers]
  end

  def create
    @survey_response = @collection.create_uniq_survey_response(user_id: json_api_params[:data][:attributes][:user_id])
    if @survey_response
      render jsonapi: @survey_response
    else
      render_api_errors @survey_response.errors
    end
  end

  private

  def load_test_collection
    # NOTE: not sure why DeserializableSurveyResponse wasn't happy here (`no id for nil` 500 error),
    # had to just use json_api_params
    id = json_api_params['data']['attributes']['test_collection_id']
    @collection = Collection::TestCollection.find(id)
    head(400) unless @collection.present? && @collection.live? && @collection.active?
  end

  def load_and_authorize_survey_response
    # You should only be able to view your own survey response for now. This
    # could eventually be smarter to allow test owners to view their own survey
    # responses
    @survey_response = SurveyResponse.find_by(id: params[:id])
    if current_user.nil?
      head 404
      return false
    end
    if @survey_response.user_id && @survey_response.user_id != current_user.id
      head 404
      return false
    end
    true
  end
end
