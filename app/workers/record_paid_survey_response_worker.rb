class RecordPaidSurveyResponseWorker
  include Sidekiq::Worker

  def perform(survey_response_id)
    survey_response = SurveyResponse.find(survey_response_id)
    survey_response.record_incentive_paid!
  end
end
