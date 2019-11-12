module TestResultsCollection
  class CreateOrLinkAliasCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_collection,
           :test_results_collection,
           :survey_response,
           :responses_collection,
           :created_by,
           :idea

    require_in_context :responses_collection

    delegate :test_collection, :test_results_collection, :created_by,
             :survey_response, :responses_collection,
             to: :context

    delegate :idea,
             to: :context,
             allow_nil: true

    def call
      create_alias_collection
      # link_to_test_audience
    end

    private

    def default_collection_attrs
      {
        organization: test_collection.organization,
        roles_anchor_collection: test_collection.roles_anchor,
      }
    end

    def create_alias_collection
      collection = create_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: "#{test_collection.name} - #{survey_response.respondent_alias}",
            type: 'Collection::TestResultsCollection',
            survey_response_id: survey_response.id,
            test_collection: test_collection,
          ),
          identifier: CardIdentifier.call([test_results_collection, survey_response]),
        },
        parent_collection: responses_collection,
        created_by: created_by,
      ).record

      return collection if collection.persisted?

      context.fail!(
        message: collection.errors.full_messages.to_sentence,
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
      test_audience_collection = CollectionCard.where(
        identifier: CardIdentifier.call(
          [test_results_collection, survey_response.test_audience],
        ),
      ).record

      link_alias_collection(test_audience_collection)
    end
  end
end
