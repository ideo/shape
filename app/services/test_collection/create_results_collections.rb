module TestCollection
  class CreateResultsCollections
    include Interactor::Schema

    schema :test_collection,
           :created_by

    require_in_context :test_collection

    delegate :test_collection, :created_by, to: :context

    delegate :test_results_collection, to: :test_collection

    before do
      context.created_by ||= test_collection.created_by
    end

    def call
      TestResultsCollection::CreateCollection.call(
        test_collection: test_collection,
        created_by: created_by,
      )

      # Create results collections for each idea
      idea_items.each do |idea|
        TestResultsCollection::CreateCollection.call(
          test_collection: test_collection,
          idea: idea,
          created_by: created_by,
        )
      end

      # TODO alias collections should remove test design
      move_test_design_to_end
    end

    private

    def move_test_design_to_end
      # Move feedback design to the end
      test_collection
        .reload
        .parent_collection_card
        .move_to_order(
          test_results_collection.collection_cards.maximum(:order) + 1,
        )
    end

    def idea_items
      test_collection
        .idea_items
        .includes(:test_results_collection)
    end
  end
end
