module TestResultsCollection
  class CreateResponsesCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :test_collection,
           :created_by,
           :all_responses_collection,
           :idea,
           :order

    require_in_context :parent_collection, :test_collection

    delegate :parent_collection,
             :test_collection,
             :created_by,
             :order,
             :idea,
             :all_responses_collection,
             to: :context

    delegate :test_audiences,
             :survey_responses,
             :test_results_collection,
             to: :test_collection

    def call
      if idea.present?
        context.all_responses_collection = link_all_responses_collection
      else
        context.all_responses_collection = create_all_responses_collection
        test_audiences.each do |test_audience|
          next if test_audience.closed?

          create_audience_collection(test_audience)
        end
      end

      survey_responses.each do |survey_response|
        create_or_link_alias_collection(survey_response)
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

    def create_all_responses_collection
      create_board_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: 'All Responses',
          ),
          identifier: CardIdentifier.call(test_results_collection, 'Responses'),
        },
        parent_collection: parent_collection,
        created_by: created_by,
      ).record
    end

    def link_all_responses_collection
      all_responses_collection = CollectionCard.find_record_by_identifier(
        test_results_collection,
        'Responses',
      )
      # e.g. for unit tests where this has not been created
      return unless all_responses_collection.present?

      create_card(
        params: {
          order: order,
          collection_id: all_responses_collection.id,
        },
        type: 'link',
        parent_collection: parent_collection,
      )

      all_responses_collection
    end

    def create_audience_collection(test_audience)
      create_board_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: "#{test_collection.base_name} - #{test_audience.audience_name}",
          ),
          identifier: CardIdentifier.call(test_results_collection, test_audience),
        },
        parent_collection: all_responses_collection,
        created_by: created_by,
      ).record
    end

    def create_or_link_alias_collection(survey_response)
      TestResultsCollection::CreateOrLinkAliasCollection.call(
        survey_response: survey_response,
        all_responses_collection: all_responses_collection,
        created_by: created_by,
      )
    end
  end
end
