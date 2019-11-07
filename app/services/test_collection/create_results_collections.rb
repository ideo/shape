module TestCollection
  class CreateResultsCollections
    include Interactor::Organizer
    include Interactor::Schema

    schema :test_collection,
           :created_by

    require_in_context :test_collection

    delegate :test_collection, :created_by, to: :context

    delegate :idea_cards, to: :test_collection

    def call
      TestResultsCollection::CreateCollection.call(
        test_collection: test_collection,
        created_by: created_by,
      )

      # Create results collections for each idea
      idea_cards.includes(:test_results_collection, :record).each do |idea_card|
        TestResultsCollection::CreateCollection.call(
          test_collection: test_collection,
          idea: idea_card.record,
          created_by: created_by,
        )
      end
    end
  end
end
