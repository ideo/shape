require 'sidekiq-scheduler'

class SearchkickReindexWorker
  include Sidekiq::Worker

  def perform
    # Pick up items/collections that were queued for async reindexing
    logger.debug '-- Queueing Item / Collection reindex --'
    logger.debug "Collections: #{Collection.search_index.reindex_queue.length}"
    logger.debug "Items: #{Item.search_index.reindex_queue.length}"
    Searchkick::ProcessQueueJob.perform_later(class_name: 'Collection')
    Searchkick::ProcessQueueJob.perform_later(class_name: 'Item')
  end
end
