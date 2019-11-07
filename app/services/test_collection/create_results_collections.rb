module TestCollection
  class CreateResultsCollections
    include Interactor::Organizer
    include Interactor::Schema

    schema :test_collection,
           :created_by

    require_in_context :test_collection

    delegate :test_collection, :created_by, to: :context

    delegate :idea_items, to: :test_collection

    def call
      TestResultsCollection::CreateCollection.call(
        test_collection: test_collection,
        created_by: created_by,
      )

      # Create results collections for each idea
      idea_items.includes(:test_results_collection).each do |idea|
        TestResultsCollection::CreateCollection.call(
          test_collection: test_collection,
          idea: idea,
          created_by: created_by,
        )
      end
    end
  end
end
