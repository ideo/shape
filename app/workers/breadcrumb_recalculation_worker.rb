class BreadcrumbRecalculationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(collection_id, recalculate_own_breadcrumb = true)
    collection = Collection.find(collection_id)
    # on initial collection update, breadcrumb is already calculated, no need to recalculate
    collection.recalculate_breadcrumb! if recalculate_own_breadcrumb
    # will recursively call more BreadcrumbRecalculationWorkers for sub-collections
    collection.recalculate_child_breadcrumbs
  end
end
