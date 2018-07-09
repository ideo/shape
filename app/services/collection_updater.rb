class CollectionUpdater < SimpleService
  def initialize(collection, attributes)
    @collection = collection
    @attributes = attributes
  end

  def call
    assign_attributes
    @collection.save.tap do |result|
      # caching collection cover needs to happen after cards have been updated
      cache_collection_cover_if_needed if result
    end
  end

  private

  attr_reader :organization, :parent_card, :created_by

  def assign_attributes
    @collection.attributes = @attributes
    @collection.cache_tag_list if @collection.tag_list != @collection.cached_tag_list
    @collection.cache_all_tags_list if @collection.all_tags_list != @collection.cached_all_tags_list
    # always touch the updated timestamp even though we may just be updating the related cards
    @collection.updated_at = Time.now
  end

  def cache_collection_cover_if_needed
    should_cache_cover = false
    @collection.collection_cards.each do |card|
      should_cache_cover ||= card.should_update_parent_collection_cover? if card.saved_change_to_order?
    end
    @collection.cache_cover! if should_cache_cover
  end
end
