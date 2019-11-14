module TestResultsCollection
  class CreateResponsesCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :survey_responses,
           :test_audiences,
           :test_collection,
           :created_by,
           :all_responses_collection,
           :idea,
           :order

    require_in_context :parent_collection, :test_audiences

    delegate :parent_collection, :test_collection, :created_by,
             :test_audiences, :survey_responses, :order,
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
          identifier: CardIdentifier.call(test_collection.test_results_collection, 'Responses'),
        ).first.record

        create_card(
          params: {
            order: order,
            collection_id: all_responses_collection.id,
          },
          type: 'link',
          parent_collection: parent_collection,
        )
        return all_responses_collection
      end

      collection = create_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: 'Responses',
          ),
          identifier: CardIdentifier.call(parent_collection, 'Responses'),
        },
        parent_collection: parent_collection,
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
          identifier: CardIdentifier.call(parent_collection, test_audience),
        },
        parent_collection: context.all_responses_collection,
        created_by: created_by,
      ).record

      return if collection.persisted?

      context.fail!(
        message: collection.errors.full_messages.to_sentence,
      )
    end
  end
end
