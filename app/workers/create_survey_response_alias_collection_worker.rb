class CreateSurveyResponseAliasCollectionWorker
  include Sidekiq::Worker

  delegate :test_results_collection,
           :test_collection,
           :user,
           to: :@survey_response

  def perform(survey_response_id)
    @survey_response = SurveyResponse.find(survey_response_id)
    return if !@survey_response.completed? || test_results_collection.present?

    create_alias_collection
    ping_results_collection
  end

  private

  def create_alias_collection
    TestResultsCollection::CreateOrLinkAliasCollection.call(
      test_collection: test_collection,
      all_responses_collection: all_responses_collection,
      survey_response: @survey_response,
      created_by: user,
    )
  end

  def ping_results_collection
    # real-time update any graphs, etc.
    master_test_results_collection.touch
    Collection::TestResultsCollection.in_collection(master_test_results_collection).each do |collection|
      collection.touch
      CollectionUpdateBroadcaster.call(collection)
    end

    CollectionUpdateBroadcaster.call(master_test_results_collection)
  end

  def all_responses_collection
    CollectionCard.find_record_by_identifier(
      master_test_results_collection,
      'Responses',
    )
  end

  def master_test_results_collection
    test_collection.test_results_collection
  end
end
