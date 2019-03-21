class PopulateGettingStartedShellCollection < SimpleService
  def initialize(collection, for_user:)
    @collection = collection
    @for_user = for_user
  end

  def call
    @cloned_from = @collection.cloned_from
    return false unless @cloned_from.present?
    duplicate_cards
    @collection.cache_card_count!
    @collection.update(getting_started_shell: false)
    @collection
  end

  def duplicate_cards
    CollectionCardDuplicator.call(
      to_collection: @collection,
      cards: @cloned_from.collection_cards,
      placement: 'beginning',
      for_user: @for_user,
      system_collection: true,
    )
  end
end
