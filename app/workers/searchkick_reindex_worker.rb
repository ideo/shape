require 'sidekiq-scheduler'

class SearchkickReindexWorker
  include Sidekiq::Worker

  def perform
    # Index any collections that were queued
    puts ':: Queueing Item / Collection reindex ::'
    puts "Collections: #{Collection.search_index.reindex_queue.length}"
    puts "Items: #{Item.search_index.reindex_queue.length}"
    Searchkick::ProcessQueueJob.perform_later(class_name: 'Collection')
    Searchkick::ProcessQueueJob.perform_later(class_name: 'Item')
  end
end
