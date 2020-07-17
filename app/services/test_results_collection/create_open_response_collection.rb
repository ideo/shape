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
        # update name if you had changed the text of the open response question
        existing_card.collection.update(name: open_response_collection_name)
      else
        create_board_card(
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
        width: 2,
        identifier: identifier,
        collection_attributes: {
          name: open_response_collection_name,
          type: 'Collection::TestOpenResponses',
          cover_type: :cover_type_carousel,
          question_item_id: question_item.id,
        },
      }
    end

    def open_response_collection_name
      "#{question_item.content} Responses"
    end

    def test_collection
      question_item.parent
    end

    def identifier
      CardIdentifier.call(parent_collection, question_item, 'OpenResponses')
    end
  end
end
