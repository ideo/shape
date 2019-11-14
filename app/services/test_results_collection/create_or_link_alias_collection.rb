module TestResultsCollection
  class CreateOrLinkAliasCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :survey_response,
           :all_responses_collection,
           :alias_test_results_collection,
           :created_by

    require_in_context :survey_response, :all_responses_collection

    delegate :alias_test_results_collection, :created_by,
             :survey_response, :all_responses_collection,
             to: :context

    delegate :test_collection,
             to: :survey_response

    delegate :test_results_collection,
             to: :test_collection

    def call
      create_alias_collection
      create_and_link_open_responses
      link_to_test_audience
    end

    private

    def default_collection_attrs
      {
        organization: test_collection.organization,
        roles_anchor_collection: test_collection.roles_anchor,
      }
    end

    def create_alias_collection
      context.alias_test_results_collection = create_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: "#{test_collection.base_name} - #{survey_response.respondent_alias}",
            type: 'Collection::TestResultsCollection',
            survey_response_id: survey_response.id,
            test_collection: test_collection,
          ),
          identifier: CardIdentifier.call(test_results_collection, survey_response),
        },
        parent_collection: all_responses_collection,
        created_by: created_by,
      ).record

      # Reload to get test_results_collection relationship
      survey_response.reload

      TestResultsCollection::CreateContent.call!(
        test_results_collection: alias_test_results_collection,
        created_by: created_by,
        survey_response: survey_response,
      )
    end

    def link_alias_collection(parent)
      alias_collection = Collection.find_by(
        survey_response_id: survey_response.id,
      )

      alias_collection = create_alias_collection(survey_response) if alias_collection.blank?

      CollectionCard::Link.create(
        parent: parent,
        collection_id: alias_collection.id,
      )
    end

    def link_to_test_audience
      test_audience_collection_card = CollectionCard.find_by(
        identifier: CardIdentifier.call(
          test_results_collection, survey_response.test_audience
        ),
      )
      if test_audience_collection_card.blank?
        context.fail!(message: 'Missing audience card')
      end

      link_alias_collection(test_audience_collection_card.collection)
    end

    def create_and_link_open_responses
      survey_response.question_answers.each do |question_answer|
        next unless question_answer.question.question_open?

        TestResultsCollection::CreateAndLinkOpenResponse.call(
          test_collection: test_collection,
          alias_test_results_collection: alias_test_results_collection,
          question_answer: question_answer,
        )
      end
    end
  end
end
