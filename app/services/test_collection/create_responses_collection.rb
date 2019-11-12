module TestCollection
  class CreateResponsesCollections
    include Interactor::Schema

    schema :test_results_collection,
           :survey_responses,
           :test_audiences,
           :created_by

    require_in_context :test_results_collection, :audiences

    delegate :test_results_collection, :test_collection, :idea, :created_by,
             :all_responses_collection, :test_audiences,
             to: :context

    def call
      context.all_responses_collection = create_all_responses_collection if idea.blank?

      survey_responses.each do |survey_response|
        if idea.present?
          link_alias_collection(survey_response, test_results_collection)
        else
          create_alias_collection(survey_response)
        end
      end

      test_audiences.each do |test_audience|
        if idea.present?
          link_audience_collection(test_audience)
        else
          create_audience_collection(test_audience)
        end
      end
    end

    private

    def default_collection_attrs
      {
        organization: test_collection.organization,
        created_by: created_by,
        roles_anchor_collection: test_collection.roles_anchor,
        test_collection: test_collection,
        idea: idea
      }
    end

    def create_all_responses_collection
      collection = create_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: 'All Responses',
            idea: nil,
          ),
        },
        parent_collection: test_collection.test_results_collection,
        created_by: created_by,
        identifier: "all-responses",
      ).record

      return collection if collection.persisted?

      context.fail!(
        message: collection.errors.full_messages.to_sentence,
      )
    end

    def create_alias_collection(survey_response)
      collection = create_card(
        params: {
          collection_attributes: default_collection_attrs.merge(
            name: "#{test_collection.name} - #{survey_response.respondent_alias}",
            type: 'Collection::TestResultsCollection',
          )
        },
        parent_collection: all_responses_collection,
        created_by: created_by,
        identifier: identifier_for_alias(survey_response),
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
          )
        },
        parent_collection: all_responses_collection,
        created_by: created_by,
        identifier: identifier_for_audience(test_audience.audience),
      ).record

      if !collection.persisted?
        context.fail!(
          message: collection.errors.full_messages.to_sentence,
        )
        return
      end

      link_all_aliases(test_audience, collection)
    end

    def link_audience_collection(test_audience)
      audience_card = CollectionCard.where(
        identifier: identifier_for_audience(test_audience.audience)
      )

      if audience_card.blank?
        context.fail!(message: 'Audience collection missing')
        return
      end

      link = CollectionCard::Link.create(
        parent: test_results_collection,
        collection_id: audience_card.collection.id,
        identifier: "#{audience_card.identifier}-link",
      )
    end

    def link_all_aliases(test_audience, parent)
      test_audience.survey_responses.each do |survey_response|
        link_alias_collection(survey_response, parent)
      end
    end

    def link_alias_collection(survey_response, parent)
      alias_card = CollectionCard.where(
        identifier: identifier_for_alias(survey_response)
      )

      if alias_card.blank?
        context.fail!(message: 'Alias collection missing')
        return
      end

      link = CollectionCard::Link.create(
        parent: parent,
        collection_id: alias_card.collection.id,
        identifier: "#{alias_card.identifier}-link",
      )
    end

    def identifier_for_alias(survey_response)
      "alias-#{survey_response.respondent_alias}"
    end

    def identifier_for_audience(audience)
      "audience-#{audience.name}"
    end
  end
end
