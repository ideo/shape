class SurveyResponseCompletion < SimpleService
  delegate :test_collection, :gives_incentive?, :user, to: :@survey_response
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
    return unless gives_incentive? && user&.email.present?
    # perform some checks: you can only get marked owed + paid once per TestCollection
    return if @survey_response.incentive_owed?
    already_owed_or_paid = SurveyResponse
                           .where(incentive_status: %i[incentive_paid incentive_owed])
                           .find_by(user: user, test_collection: @survey_response.test_collection)
    return if already_owed_or_paid.present?
    @survey_response.record_incentive_owed!
  end

  def ping_collection
    # real-time update any graphs, etc.
    test_collection.touch
    CollectionUpdateBroadcaster.call(test_collection)
  end
end
