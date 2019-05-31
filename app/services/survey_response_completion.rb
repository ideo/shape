class SurveyResponseCompletion < SimpleService

  delegate :test_collection, to: :@survey_response
  delegate :test_audience, to: :@survey_response, allow_nil: true

  def initialize(survey_response)
    @survey_response = survey_response
  end

  def call
    @survey_response.save
    @survey_response.cache_test_scores!
    update_test_audience_status
    find_or_create_incentive_record
    ping_collection
  end

  private

  def update_test_audience_status
    return if test_audience.blank?

    test_audience.survey_response_completed!
  end

  def find_or_create_incentive_record
    return unless test_collection.gives_incentive?

    user = @survey_response.user
    return unless user.present?
    return if @survey_response.feedback_incentive_record.present?
    # TODO: do we want this service to validate if the user has a duplicate response for the same TestCollection?
    # e.g.
    # return if SurveyResponse.find_by(user: user, test_collection: @survey_response.test_collection)
    @survey_response.create_feedback_incentive_record(
      user: user,
      amount: ::FEEDBACK_INCENTIVE_AMOUNT,
      current_balance: user.current_incentive_balance + ::FEEDBACK_INCENTIVE_AMOUNT,
    )
  end

  def ping_collection
    # real-time update any graphs, etc.
    CollectionUpdateBroadcaster.call(test_collection)
  end
end
