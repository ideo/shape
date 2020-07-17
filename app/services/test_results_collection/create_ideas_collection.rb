module TestResultsCollection
  class CreateIdeasCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :order,
           :created_by,
           :ideas_collection_card,
           :message

    require_in_context :test_results_collection

    delegate :test_results_collection,
             :ideas_collection_card,
             :created_by,
             :order,
             to: :context

    delegate :test_collection,
             to: :test_results_collection

    before do
      context.created_by ||= test_results_collection.created_by
      context.ideas_collection_card = find_existing_card
      context.order ||= 0
    end

    def call
      if ideas_collection_card.present?
        update_collection
      else
        context.ideas_collection_card = create_ideas_collection_card
      end

      # Add all ideas as cards to this collection
      ideas_card_order = 0

      test_collection.idea_items.each_with_index do |idea_item, i|
        result = TestResultsCollection::CreateIdeaCollectionCards.call!(
          parent_collection: ideas_collection_card.collection,
          idea_item: idea_item,
          created_by: created_by,
          order: ideas_card_order,
          num_idea: i + 1,
        )
        ideas_card_order = result.order
      end
    end

    private

    def find_existing_card
      test_results_collection
        .primary_collection_cards
        .collection
        .identifier('ideas-collection')
        .includes(:collection)
        .first
    end

    def create_ideas_collection_card
      create_board_card(
        params: ideas_collection_card_attrs,
        parent_collection: test_results_collection,
        created_by: created_by,
      )
    end

    def update_collection
      return if ideas_collection_card.order == order

      ideas_collection_card.update(order: order)
    end

    def ideas_collection_card_attrs
      {
        order: order,
        width: 2,
        height: 2,
        identifier: 'ideas-collection',
        collection_attributes: {
          name: "#{test_collection.base_name} - Ideas",
        },
      }
    end
  end
end
