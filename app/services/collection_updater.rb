class CollectionUpdater < SimpleService
  def initialize(collection, attributes)
    @collection = collection
    @attributes = attributes
  end

  def call
    assign_attributes
    build_submissions_collection_if_needed
    @collection.save.tap do |result|
      # caching collection cover needs to happen after cards have been updated
      cache_collection_cover_if_needed if result
      # TODO: could ignore this part unless collection_card attrs have changed...
      if @collection.master_template? && @attributes[:collection_cards_attributes].present?
        # we just added a template card, so update the instances
        @collection.queue_update_template_instances
      end
    end
  end

  private

  attr_reader :organization, :parent_card, :created_by

  def assign_attributes
    @collection.attributes = @attributes
    @collection.update_cached_tag_lists
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

  def build_submissions_collection_if_needed
    return unless @collection.is_a? Collection::SubmissionBox
    return unless @collection.will_save_change_to_submission_box_type?
    return unless @collection.submissions_collection.nil?
    @collection.setup_submissions_collection
  end
end
