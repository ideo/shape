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
      if @collection.master_template?
        # TODO: could ignore this part unless collection_card attrs have changed...
        if @attributes[:collection_cards_attributes].present?
          # we just added a template card, so update the instances
          @collection.queue_update_template_instances
        end
        if @collection.saved_change_to_collection_to_test_id
          @collection.update_test_template_instance_types!
        end
      end

      # check if hide_submissions was toggled off, in which case we want to un-hide all submissions
      # `break result` means break from this block and return result
      break result unless @collection.is_a?(Collection::SubmissionBox)
      break result unless @collection.saved_change_to_hide_submissions && !@collection.hide_submissions
      @collection.submissions.find_each do |submission|
        Roles::MergeToChild.call(parent: @collection, child: submission)
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
end
