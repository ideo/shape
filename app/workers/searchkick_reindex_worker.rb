require 'sidekiq-scheduler'

class SearchkickReindexWorker
  include Sidekiq::Worker

  def perform
    # Index any collections that were queued
    puts 'Queueing Collection reindex'
    puts "Num to reindex: #{Collection.search_index.reindex_queue.length}"
    Searchkick::ProcessQueueJob.perform_later(class_name: 'Collection')
  end
end
