module TestResultsCollection
  class CreateOpenResponseCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :question_item,
           :created_by,
           :message

    require_in_context :question_item

    delegate :question_item,
             to: :context

    delegate :parent_collection_card, to: :question_item

    delegate :test_results_collection, to: :test_collection

    def call
      create_card(
        attrs: open_response_collection_card_attrs(question_item),
        parent_collection: test_results_collection,
        created_by: created_by,
      )
    end

    private

    def created_by
      context.created_by || test_results_collection.created_by
    end

    def open_response_collection_card_attrs(question_item)
      {
        order: parent_collection_card.order,
        collection_attributes: {
          name: "#{question_item.content} Responses",
          type: 'Collection::TestOpenResponses',
          question_item_id: question_item.id,
        },
      }
    end

    def test_collection
      question_item.parent
    end
  end
end
