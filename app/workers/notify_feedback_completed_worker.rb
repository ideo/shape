require 'sidekiq-scheduler'

class NotifyFeedbackCompletedWorker
  include Sidekiq::Worker

  def perform(test_collection_id)
    collection = Collection.find(test_collection_id)
    editors = collection.editors
    user_ids = editors[:users].pluck(:id)
    groups_user_ids = editors[:groups].map(&:user_ids).flatten

    (user_ids + groups_user_ids).uniq.each do |user_id|
      TestCollectionMailer.notify_closed(
        collection_id: collection.id,
        user_id: user_id,
      ).deliver_later
    end
  end
end
