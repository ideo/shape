class BreadcrumbRecalculationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(collection_id, subtree_identifier = nil)
    collection = Collection.find(collection_id)
    # Start processing
    collection.recalculate_breadcrumb_tree!(
      subtree_identifier: subtree_identifier,
      force_sync: true
    )
    # Done processing
  end
end
