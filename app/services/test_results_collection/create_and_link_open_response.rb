module TestResultsCollection
  class CreateAndLinkOpenResponse
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_collection,
           :alias_test_results_collection,
           :question_answer,
           :open_response_item

    delegate :alias_test_results_collection, :question_answer,
             :open_response_item, :test_collection,
             to: :context

    delegate :question, :survey_response,
             to: :question_answer

    def call
      context.open_response_item = create_open_response_item
      link_open_response_item
    end

    private

    def create_open_response_item
      question_answer.create_open_response_item(alias_open_responses_collection)
    end

    def link_open_response_item
      CollectionCard::Link.create(
        parent: question_open_responses_collection,
        item_id: open_response_item.id,
        width: 2,
      )

      idea_items.each do |idea_item|
        CollectionCard::Link.create(
          parent: question_idea_open_responses_collection(idea_item),
          item_id: open_response_item.id,
          width: 2,
        )
      end
    end

    def question_open_responses_collection
      open_responses_collection(test_collection.test_results_collection)
    end

    def question_idea_open_responses_collection(idea_item)
      idea_collection = idea_collection(idea_item)
      open_responses_collection(idea_collection)
    end

    def open_responses_collection(parent_collection)
      CollectionCard.find_by(
        identifier: CardIdentifier.call(parent_collection, question, 'OpenResponses'),
      ).collection
    end

    def alias_open_responses_collection
      CollectionCard.find_by(
        identifier: CardIdentifier.call(survey_response, 'OpenResponses'),
      ).collection
    end

    def idea_collection(idea_item)
      CollectionCard.find_by(
        identifier: CardIdentifier.call(
          test_collection.test_results_collection, idea_item
        ),
      ).collection
    end

    def idea_items
      test_collection
        .idea_items
        .includes(:test_results_collection)
    end
  end
end
