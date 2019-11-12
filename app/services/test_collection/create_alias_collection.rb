module TestCollection
  class CreateAliasCollection
    include Interactor::Schema

    schema :test_responses_collection,
           :survey_response

    require_in_context :test_responses_collection

    def call
      collection = create_alias_collection
      TestResultsCollection::CreateContent.call!(
        test_results_collection: collection,
        created_by: created_by,
      )
    end
end
