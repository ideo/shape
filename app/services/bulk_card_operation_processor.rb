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
    return false unless create_placeholder

    queue_bulk_action
    @placeholder
  end

  private

  def create_placeholder
    if @placement.is_a?(String) || @placement.is_a?(Integer)
      order = @to_collection.card_order_at(@placement)
    elsif @placement.respond_to?('[]')
      row = @placement.try(:[], 'row')
      col = @placement.try(:[], 'col')
    else
      return false
    end

    @placeholder = CollectionCard::Placeholder.new(
      parent: @to_collection,
      order: order,
      row: row,
      col: col,
      width: 1,
      height: 1,
      item_attributes: {
        type: 'Item::TextItem',
        content: placeholder_message,
        roles_anchor_collection_id: @to_collection.roles_anchor.id,
      },
    )
    if @to_collection.board_collection?
      return false unless @placeholder.board_placement_is_valid?
    end

    @placeholder.save
    return false unless @placeholder.persisted?

    # bump cards out of the way as needed
    @placeholder.move_to_order(order)
    true
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
