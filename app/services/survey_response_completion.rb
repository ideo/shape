class SurveyResponseCompletion < SimpleService
  delegate :test_collection, :gives_incentive?, to: :@survey_response
  delegate :test_audience, to: :@survey_response, allow_nil: true

  def initialize(survey_response)
    @survey_response = survey_response
  end

  def call
    @survey_response.save
    @survey_response.cache_test_scores!
    update_test_audience_status
    mark_response_as_payment_owed
    ping_collection
  end

  private

  def update_test_audience_status
    return if test_audience.blank?

    test_audience.survey_response_completed!
  end

  def mark_response_as_payment_owed
    return unless gives_incentive?

    user = @survey_response.user
    return unless user.present?
    # Return if already marked as being owed
    return if @survey_response.payment_owed?
    # TODO: do we want this service to validate if the user has a duplicate response for the same TestCollection?
    # e.g.
    # return if SurveyResponse.find_by(user: user, test_collection: @survey_response.test_collection)
    @survey_response.record_incentive_owed!
  end

  def ping_collection
    # real-time update any graphs, etc.
    test_collection.touch
    CollectionUpdateBroadcaster.call(test_collection)
  end
end
