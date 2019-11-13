module TestResultsCollection
  class CreateOpenResponseCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :question_item,
           :order,
           :created_by,
           :message

    require_in_context :question_item, :parent_collection

    delegate :question_item, :parent_collection, :created_by, :order,
             to: :context

    delegate :parent_collection_card, to: :question_item

    before do
      context.created_by ||= parent_collection.created_by
    end

    def call
      if existing_card.present?
        existing_card.update(order: order) unless existing_card.order == order
      else
        create_card(
          params: open_response_collection_card_attrs(question_item),
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
        .identifier(identifier)
        .first
    end

    def open_response_collection_card_attrs(question_item)
      {
        order: order,
        identifier: identifier,
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

    def identifier
      CardIdentifier.call(
        [parent_collection, question_item],
        'Responses'
      )
    end
  end
end
