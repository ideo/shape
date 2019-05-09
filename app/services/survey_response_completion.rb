class SurveyResponseCompletion < SimpleService
  def initialize(survey_response)
    @survey_response = survey_response
  end

  def call
    update_survey_status
    find_or_create_incentive_record
    ping_collection
    # TODO: (when we get to this story) calculate if test_audience has reached its max # of responses
  end

  private

  def update_survey_status
    @survey_response.update(
      status: :completed,
    )
    @survey_response.cache_test_scores!
  end

  def find_or_create_incentive_record
    return unless @survey_response.test_collection.gives_incentive?

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
    CollectionUpdateBroadcaster.call(@survey_response.test_collection)
  end
end
