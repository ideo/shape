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

    delegate :question,
             to: :question_answer

    def call
      context.open_response_item = create_open_response_item
      link_open_response_item
    end

    private

    def create_open_response_item
      question_answer.create_open_response_item(master_open_responses_collection)
    end

    def link_open_response_item
      CollectionCard::Link.create(
        parent: question_open_responses_collection,
        item_id: open_response_item.id,
        width: 2,
      )
    end

    def question_open_responses_collection
      identifier = CardIdentifier.call(
        [test_collection.test_results_collection, question],
        'Responses',
      )
      CollectionCard.find_by(
        identifier: identifier,
      ).collection
    end

    def master_open_responses_collection
      CollectionCard.find_by(
        identifier: CardIdentifier.call([alias_test_results_collection], 'Responses'),
      ).collection
    end
  end
end
