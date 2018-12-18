class CollectionCardDuplicator < SimpleService
  def initialize(to_collection:, cards:, placement:, for_user:, system_collection: false)
    @to_collection = to_collection
    @cards = cards
    @placement = placement
    @for_user = for_user
    @system_collection = system_collection
    @new_cards = []
  end

  def call
    duplicate_cards
    @new_cards
  end

  private

  def duplicate_cards
    should_update_cover = false
    # reverse cards for 'beginning' since they get duplicated one by one to the front
    @cards = @cards.reverse if @placement == 'beginning'
    @cards.each do |card|
      dup = card.duplicate!(
        for_user: @for_user,
        parent: @to_collection,
        placement: @placement,
        duplicate_linked_records: true,
        system_collection: @system_collection,
      )
      should_update_cover ||= dup.should_update_parent_collection_cover?
      @new_cards << dup
    end
    @to_collection.reorder_cards!
    @to_collection.cache_cover! if should_update_cover
  end
end
