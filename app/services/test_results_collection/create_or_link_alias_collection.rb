module TestResultsCollection
  class CreateOrLinkAliasCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :survey_response,
           :all_responses_collection,
           :alias_test_results_collection,
           :created_by

    require_in_context :survey_response,
                       :all_responses_collection

    delegate :alias_test_results_collection,
             :created_by,
             :survey_response,
             :all_responses_collection,
             to: :context

    delegate :test_collection,
             to: :survey_response

    delegate :test_results_collection,
             to: :test_collection

    def call
      find_or_create_alias_collection
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

    def find_or_create_alias_collection
      existing_card = CollectionCard.identifier(identifier).first
      return existing_card.record if existing_card.present?

      # TODO: refactor this to also use TestResultsCollection::CreateCollection?
      context.alias_test_results_collection = create_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: "#{test_collection.base_name} - #{survey_response.respondent_alias}",
            type: 'Collection::TestResultsCollection',
            survey_response_id: survey_response.id,
            test_collection: test_collection,
          ),
          identifier: identifier,
        },
        parent_collection: all_responses_collection,
        created_by: created_by,
      ).record

      # Reload to get test_results_collection relationship
      survey_response.reload

      TestResultsCollection::CreateContent.call!(
        test_results_collection: alias_test_results_collection,
        created_by: created_by,
      )

      context.alias_test_results_collection
    end

    def create_and_link_open_responses
      survey_response.question_answers.each do |question_answer|
        next unless question_answer.question.question_open?

        TestResultsCollection::CreateAndLinkOpenResponse.call(
          test_collection: test_collection,
          question_answer: question_answer,
        )
      end
    end

    def link_alias_collection(parent)
      alias_collection = find_or_create_alias_collection

      create_card(
        parent_collection: parent,
        type: 'link',
        params: {
          collection_id: alias_collection.id
        }
      )
    end

    def link_to_test_audience
      test_audience_collection = CollectionCard.find_record_by_identifier(
        test_results_collection, survey_response.test_audience
      )
      if test_audience_collection.blank?
        context.fail!(message: 'Missing audience collection')
      end

      link_alias_collection(test_audience_collection)
    end

    def identifier
      CardIdentifier.call(test_results_collection, survey_response)
    end
  end
end
