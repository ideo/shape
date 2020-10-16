class CollectionCardUpdater < SimpleService
  def initialize(collection_card, attributes)
    @collection_card = collection_card
    @attributes = attributes
  end

  def call
    assign_attributes
    if @attributes['cover_card_id'].present?
      @collection_card.cache_cover
    end
    @collection_card.save
  end

  def assign_attributes
    @collection_card.attributes = @attributes
    @collection_card.updated_at = Time.now
  end
end
