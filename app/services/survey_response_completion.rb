class SurveyResponseCompletion < SimpleService
  delegate :test_collection, :gives_incentive?, :completed?, :user, to: :@survey_response
  delegate :test_audience, to: :@survey_response, allow_nil: true

  def initialize(survey_response)
    @survey_response = survey_response
  end

  def call
    mark_as_completed!
    @survey_response.cache_test_scores!
    update_test_audience_if_complete
    create_alias_collection
    mark_response_as_payment_owed
    ping_results_collection
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
    where_status = { status: :completed }
    if gives_incentive?
      where_status[:incentive_status] = %i[incentive_paid incentive_owed]
    end
    SurveyResponse
      .where(where_status)
      .find_by(user: user, test_collection: @survey_response.test_collection)
      .present?
  end

  def create_alias_datasets
    # alias_collection = CollectionCard.find_by(
    #   identifier: CardIdentifier.call([test_results_collection, survey_response])
    # )
    test_collection = @survey_response.test_collection
    all_responses = CollectionCard.find_by(
      identifier: CardIdentifier.call([test_collection.test_results_collection], 'Responses'),
    )
    TestResultsCollection::CreateOrLinkAliasCollection.call(
      test_collection: test_collection,
      test_results_collection: all_responses,
      survey_response: @survey_response,
      responses_collection: all_responses,
      created_by: user,
    )
  end

  def create_alias_collection
    test_collection = @survey_response.test_collection
    responses_collection = CollectionCard.where(
      identifier: CardIdentifier.call([test_collection.test_results_collection], 'Responses'),
    ).first.record

    TestResultsCollection::CreateOrLinkAliasCollection.call(
      test_collection: test_collection,
      test_results_collection: test_collection.test_results_collection,
      responses_collection: responses_collection,
      survey_response: @survey_response,
      created_by: user,
    )
  end

  def mark_response_as_payment_owed
    return unless completed? && gives_incentive? && user&.email.present?
    # perform some checks: you can only get marked owed + paid once per TestCollection
    return if @survey_response.incentive_owed?

    @survey_response.record_incentive_owed!
  end

  def ping_results_collection
    test_results_collection = test_collection.test_results_collection
    return unless test_results_collection.present?

    # real-time update any graphs, etc.
    test_results_collection.touch
    CollectionUpdateBroadcaster.call(test_results_collection)
  end
end
