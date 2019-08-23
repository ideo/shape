class CollectionCardDuplicator
  def initialize(
    to_collection:,
    cards:,
    for_user:
  )
    @to_collection = to_collection
    @cards = cards
    @for_user = for_user
  end

  def duplicate_current_cards(from_collection)
    current_card_opts = primitive_params.merge(
      from_collection_id: from_collection.id,
      duplicate_linked_records: true,
    )
    CollectionCardDuplicationWorker.perform_async(current_card_opts.to_json)
  end

  def duplicate_child_collection_cards(system_collection, synchronous)
    child_opts = {
      system_collection: system_collection,
      synchronous: synchronous,
    }
    if synchronous
      CollectionCardDuplicationWorker.new.perform(child_opts.to_json)
    else
      CollectionCardDuplicationWorker.perform_async(child_opts.to_json)
    end
  end

  def duplicate_system_collection
    # reverse cards for 'beginning' or dropping into a particular order,
    # since they get duplicated one by one to the front
    @cards = @cards.reverse
    system_opts = primitive_params.merge(
      duplicate_linked_records: true,
      system_collection: true,
    )
    CollectionCardDuplicationWorker.perform_async(system_opts.to_json)
  end

  private

  def primitive_params
    card_ids = @cards.map(&:id)
    {
      parent_collection_id: @to_collection.id,
      card_ids: card_ids,
      for_user_id: @for_user.id,
    }
  end
end
