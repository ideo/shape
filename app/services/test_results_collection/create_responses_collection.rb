module TestResultsCollection
  class CreateResponsesCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :survey_responses,
           :test_audiences,
           :test_collection,
           :created_by,
           :all_responses_collection,
           :idea

    require_in_context :test_results_collection, :test_audiences

    delegate :test_results_collection, :test_collection, :created_by,
             :test_audiences, :survey_responses,
             to: :context

    delegate :idea,
             to: :context,
             allow_nil: true

    def call
      context.all_responses_collection = create_or_link_all_responses_collection

      # Don't create duplicate audience collections for ideas
      if idea.blank?
        test_audiences.each do |test_audience|
          create_audience_collection(test_audience)
        end
      end

      survey_responses.each do |survey_response|
        TestResultsCollection::CreateOrLinkAliasCollection.call(
          survey_response: survey_response,
          responses_collection: context.all_responses_collection,
          test_collection: test_collection,
          created_by: created_by,
        )
      end
    end

    private

    def default_collection_attrs
      {
        organization: test_collection.organization,
        created_by: created_by,
        roles_anchor_collection: test_collection.roles_anchor,
      }
    end

    def create_or_link_all_responses_collection
      if idea.present?
        all_responses_collection = CollectionCard.where(
          identifier: CardIdentifier.call([test_collection.test_results_collection], 'Responses'),
        ).first.record

        CollectionCard::Link.create(
          parent: test_results_collection,
          collection_id: all_responses_collection.id,
        )
        return all_responses_collection
      end

      collection = create_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: "Responses",
          ),
          identifier: CardIdentifier.call([test_results_collection], 'Responses'),
        },
        parent_collection: test_results_collection,
        created_by: created_by,
      ).record

      return collection if collection.persisted?

      context.fail!(
        message: collection.errors.full_messages.to_sentence,
      )
    end

    def create_audience_collection(test_audience)
      collection = create_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: "#{test_collection.name} - #{test_audience.audience_name}",
          ),
          identifier: CardIdentifier.call([test_results_collection, test_audience]),
        },
        parent_collection: context.all_responses_collection,
        created_by: created_by,
      ).record

      if !collection.persisted?
        context.fail!(
          message: collection.errors.full_messages.to_sentence,
        )
        return
      end

      link_all_aliases(test_audience, collection)
    end

    def link_all_aliases(test_audience, parent)
      test_audience.survey_responses.each do |survey_response|
        TestResultsCollection::CreateOrLinkAliasCollection.call(
          survey_response: survey_response,
          responses_collection: parent,
          idea: idea,
        )
      end
    end
  end
end
