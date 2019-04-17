class Api::V1::SurveyResponsesController < Api::V1::BaseController
  skip_before_action :check_api_authentication!
  before_action :load_test_collection, only: %i[create]

  before_action :load_and_authorize_survey_response, only: %i[show]
  def show
    render jsonapi: @survey_response, include: %i[question_answers]
  end

  def create
    # NOTE: because we create a unique session_uid every time, this means that for submission box
    # tests we aren't really "progressing" you through ones you haven't seen, unless you're logged in.
    @survey_response = @collection.create_uniq_survey_response(user_id: current_user&.id)
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
    head(:unprocessable_entity) unless @collection.present? && @collection.live? && @collection.active?
  end

  def load_and_authorize_survey_response
    # You should only be able to view your own survey response for now. This
    # could eventually be smarter to allow test owners to view their own survey
    # responses
    @survey_response = SurveyResponse.find_by(id: params[:id])
    if current_user.nil?
      head :not_found
      return false
    end
    if @survey_response.user_id && @survey_response.user_id != current_user.id
      head :not_found
      return false
    end
    true
  end
end
