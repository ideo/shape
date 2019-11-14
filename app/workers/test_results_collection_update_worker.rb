class TestResultsCollectionUpdateWorker
  include Sidekiq::Worker

  def perform(test_collection_id, created_by_id = nil)
    test_collection = Collection.find(test_collection_id)
    user = User.find_by(id: created_by_id) if created_by_id.present?

    TestCollection::CreateResultsCollections.call!(
      test_collection: test_collection,
      created_by: user,
    )
  end
end
