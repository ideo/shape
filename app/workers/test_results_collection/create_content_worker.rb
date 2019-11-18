module TestResultsCollection
  class CreateContentWorker
    include Sidekiq::Worker

    def perform(test_results_collection_id, created_by_id = nil)
      @test_results_collection = Collection::TestResultsCollection.find(test_results_collection_id)
      @created_by = created_by_id ? User.find(created_by_id) : nil

      TestResultsCollection::CreateContent.call(
        test_results_collection: @test_results_collection,
        created_by: @created_by,
      )
    end
  end
end
