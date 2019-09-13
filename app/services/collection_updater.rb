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

      # TODO: Kind of an edge case of someone toggling the "hide submissions" feature
      # but we may want to put this in a worker if there are >100's of submissions
      @collection.submissions.find_each(&:submit_submission!)
    end
  end

  private

  attr_reader :organization, :parent_card, :created_by

  def assign_attributes
    cover_hash = @collection.cache_cover.to_h
    cover_hash[:hardcoded_subtitle] = @attributes[:hardcoded_subtitle]
    cover_hash[:subtitle_hidden] = @attributes[:subtitle_hidden]
    clean_collection_card_attributes
    @collection.attributes = @attributes.except(:hardcoded_subtitle, :subtitle_hidden)
    @collection.cached_cover = cover_hash
    @collection.update_cached_tag_lists
    # always touch the updated timestamp even though we may just be updating the related cards
    @collection.updated_at = Time.now
  end

  def clean_collection_card_attributes
    return unless @attributes[:collection_cards_attributes].present? &&
                  @attributes[:collection_cards_attributes].is_a?(Array)

    # remove any card_ids that are not valid from our attrs array
    # e.g. if they have been archived they will not show up in @collection.collection_cards
    card_ids = @attributes[:collection_cards_attributes].map { |c| c[:id] }
    found_ids = @collection.collection_cards.where(id: card_ids).pluck(:id)
    @attributes[:collection_cards_attributes].select! do |card_attr|
      found_ids.include?(card_attr[:id].to_i)
    end
  end

  def cache_collection_cover_if_needed
    should_cache_cover = false
    @collection.collection_cards.each do |card|
      should_cache_cover ||= card.should_update_parent_collection_cover? if card.saved_change_to_order?
    end
    @collection.cache_cover! if should_cache_cover
  end
end
