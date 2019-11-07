module TestResultsCollection
  class CreateOpenResponseCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :item,
           :order,
           :created_by,
           :message

    require_in_context :item

    delegate :item,
             to: :context

    delegate :parent_collection_card, to: :item

    delegate :test_results_collection, to: :test_collection

    def call
      if existing_card.present?
        existing_card.update(order: order) unless existing_card.order == order
      else
        create_card(
          attrs: open_response_collection_card_attrs(item),
          parent_collection: test_results_collection,
          created_by: created_by,
        )
      end
    end

    private

    def existing_card
      test_results_collection
        .primary_collection_cards
        .joins(:collection)
        .where(
          collections: {
            type: 'Collection::TestOpenResponses',
            question_item_id: item.id,
          },
        )
        .first
    end

    def created_by
      context.created_by || test_results_collection.created_by
    end

    def open_response_collection_card_attrs(item)
      {
        order: parent_collection_card.order,
        collection_attributes: {
          name: "#{item.content} Responses",
          type: 'Collection::TestOpenResponses',
          question_item_id: item.id,
        },
      }
    end

    def test_collection
      item.parent
    end
  end
end
