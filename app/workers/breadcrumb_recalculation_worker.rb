class BreadcrumbRecalculationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(collection_id)
    collection = Collection.find(collection_id)
    collection.recalculate_breadcrumb!
    # will recursively call more BreadcrumbRecalculationWorkers for sub-collections
    collection.reload.recalculate_child_breadcrumbs
  end
end
