class BreadcrumbRecalculationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(collection_id, card_ids = nil)
    @collection = Collection.find(collection_id)
    @collection.mark_children_processing_status(
      Collection.processing_statuses[:processing_breadcrumb],
    )
    if card_ids
      # e.g. if you moved a few cards you would just recalculate those breadcrumbs
      cards = CollectionCard.where(id: card_ids)
      @collection.recalculate_child_breadcrumbs(cards)
    else
      @collection.recalculate_breadcrumb_tree!(
        force_sync: true,
      )
    end
    @collection.mark_children_processing_status(nil)
  end
end
