module TestResultsCollection
  class CreateOpenResponseCollections
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :created_by,
           :message

    require_in_context :test_results_collection

    delegate :test_results_collection,
             to: :context

    delegate :question_items, to: :test_results_collection

    def call
      open_response_question_items.each do |question_item|
        # TODO: need to check if there is an open response collection item per-idea
        next if question_item.test_open_responses_collection.present?

        TestResultsCollection::CreateOpenResponseCollection.call!(
          test_results_collection: test_results_collection,
          question_item: question_item,
          created_by: created_by,
        )
      end
    end

    private

    def open_response_question_items
      question_items.question_open
                    .includes(:test_open_responses_collection)
    end

    def created_by
      context.created_by || test_collection.created_by
    end

    def open_response_collection_card_attrs(question_item)
      {
        order: question_item.parent_collection_card.order,
        collection_attributes: {
          name: "#{question_item.content} Responses",
          type: 'Collection::TestOpenResponses',
          question_item_id: question_item.id,
        },
      }
    end
  end
end
