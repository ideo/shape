class TestCollectionMailerPreview < ActionMailer::Preview
  def notify_closed
    test_collection = Collection::TestCollection.joins(:test_audiences).last
    TestCollectionMailer.notify_closed(
      collection_id: test_collection.id,
      user_id: User.last.id,
    )
  end
end
