class SurveyResponseCompletion < SimpleService
  delegate :test_collection,
           :gives_incentive?,
           :completed?,
           :user,
           :test_audience,
           :test_results_collection,
           to: :@survey_response

  def initialize(survey_response)
    @survey_response = survey_response
  end

  def call
    mark_as_completed!
    @survey_response.cache_test_scores!
    update_test_audience_if_complete
    mark_response_as_payment_owed
    create_alias_collection unless test_results_collection.present?
    @survey_response
  end

  private

  def mark_as_completed!
    return unless @survey_response.in_progress?

    status = :completed
    # For in-collection tests the response may technically be attached to a "share via link" audience;
    # but we only care if the entire test has been closed
    test_audience_closed = (test_collection.collection_to_test.nil? && test_audience&.closed?)
    if user_has_existing_survey_response?
      status = :duplicate
    elsif test_collection.closed? || test_audience_closed
      status = :completed_late
    end
    @survey_response.update(status: status)
  end

  def update_test_audience_if_complete
    return unless test_audience.present? &&
                  test_audience.reached_sample_size? &&
                  test_audience.open?

    # if we have reached the sample size on an open test audience, then close it
    test_audience.update(
      status: :closed,
      closed_at: Time.current,
    )
    # also let the test_collection now that an audience has closed
    test_collection.test_audience_closed!
  end

  def user_has_existing_survey_response?
    return false unless user.present?

    where_status = { status: :completed }
    if gives_incentive?
      where_status[:incentive_status] = %i[incentive_paid incentive_owed]
    end
    SurveyResponse
      .where(where_status)
      .find_by(user: user, test_collection: @survey_response.test_collection)
      .present?
  end

  def create_alias_collection
    CreateSurveyResponseAliasCollectionWorker.perform_async(@survey_response.id)
  end

  def mark_response_as_payment_owed
    return unless completed? && gives_incentive? && user&.email.present?
    # perform some checks: you can only get marked owed + paid once per TestCollection
    return if @survey_response.incentive_owed?

    @survey_response.record_incentive_owed!
  end
end
