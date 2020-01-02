class BulkCardOperationProcessor < SimpleService
  def initialize(cards:, action:, placement:, to_collection:, for_user: nil)
    @cards = cards
    @action = action
    @placement = placement
    @to_collection = to_collection
    @for_user = for_user
    @placeholder = nil
  end

  def call
    create_placeholder
    queue_bulk_action
    @placeholder
  end

  private

  def create_placeholder
    order = @to_collection.card_order_at(@placement)
    @placeholder = CollectionCard::Placeholder.create(
      parent: @to_collection,
      order: order,
      item_attributes: {
        type: 'Item::TextItem',
        content: placeholder_message,
        roles_anchor_collection_id: @to_collection.roles_anchor.id,
      },
    )
    # bump cards out of the way as needed
    @placeholder.move_to_order(order)
  end

  def placeholder_message
    "Bulk #{@action} operation (#{@cards.count} cards) in progress."
  end

  def queue_bulk_action
    BulkCardOperationWorker.perform_in(
      1.second,
      @cards.pluck(:id),
      @action,
      @placeholder.id,
      @for_user&.id,
    )
  end
end
