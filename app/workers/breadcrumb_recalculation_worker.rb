class BreadcrumbRecalculationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(collection_id)
    @collection = Collection.find(collection_id)
    @collection.mark_children_processing_status(
      Collection.processing_statuses[:processing_breadcrumb],
    )
    @collection.recalculate_breadcrumb_tree!(
      force_sync: true,
    )
    @collection.mark_children_processing_status(nil)
  end
end
