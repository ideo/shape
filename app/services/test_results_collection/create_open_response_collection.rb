module TestResultsCollection
  class CreateOpenResponseCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :item,
           :order,
           :created_by,
           :message

    require_in_context :item, :parent_collection

    delegate :item, :parent_collection, :created_by, :order,
             to: :context

    delegate :parent_collection_card, to: :item

    before do
      context.created_by ||= parent_collection.created_by
    end

    def call
      if existing_card.present?
        existing_card.update(order: order) unless existing_card.order == order
      else
        create_card(
          params: open_response_collection_card_attrs(item),
          parent_collection: parent_collection,
          created_by: created_by,
        )
      end
    end

    private

    def existing_card
      parent_collection
        .primary_collection_cards
        .collection
        .identifier("item-#{item.id}-responses")
        .first
    end

    def open_response_collection_card_attrs(item)
      {
        order: order,
        identifier: "item-#{item.id}-responses",
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
