class SurveyResponseCompletionWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(survey_response_id)
    survey_response = SurveyResponse.find(survey_response_id)
    SurveyResponseCompletion.call(survey_response)
  end
end
