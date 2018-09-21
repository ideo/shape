class BreadcrumbRecalculationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(collection_id, subtree_identifier = nil)
    @collection = Collection.find(collection_id)
    @collection.mark_subtree_as_processing(processing: true, subtree_identifier: subtree_identifier)
    @collection.recalculate_breadcrumb_tree!(
      subtree_identifier: subtree_identifier,
      force_sync: true
    )
    @collection.mark_subtree_as_processing(processing: false, subtree_identifier: subtree_identifier)
  end
end
