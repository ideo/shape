class BreadcrumbRecalculationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(collection_id)
    @collection = Collection.find(collection_id)
    @collection.mark_children_as_processing(processing: true)
    @collection.recalculate_breadcrumb_tree!(
      force_sync: true,
    )
    @collection.mark_children_as_processing(processing: false)
  end
end
