class CollectionUpdater < SimpleService
  def initialize(collection, attributes, unarchiving: false)
    @collection = collection
    @attributes = attributes
    @unarchiving = unarchiving
    @card_ids = []
  end

  def call
    assign_attributes
    mark_subcollection_as_private
    @collection.transaction do
      @collection.save.tap do |result|
        # caching collection cover needs to happen after cards have been updated
        cache_collection_cover_if_needed if result
        if @collection.board_collection? && @card_ids.present?
          cards = @collection.collection_cards.where(id: @card_ids)
          # rollback any invalid card moves on a board
          unless cards.all?(&:board_placement_is_valid?)
            raise ActiveRecord::Rollback
          end
        end
        if @collection.master_template?
          # TODO: could ignore this part unless collection_card attrs have changed...
          if @attributes[:collection_cards_attributes].present? && !@unarchiving
            # we just moved the template cards, so update the instances
            @collection.queue_update_template_instances(
              updated_card_ids: @collection.collection_cards.pluck(:id),
              template_update_action: :update_card_attributes,
            )
          end
          if @collection.saved_change_to_collection_to_test_id
            @collection.update_test_template_instance_types!
          end
        end
        if @collection.saved_change_to_collection_to_test_id &&
           @collection.is_a?(Collection::TestCollection)
          @collection.hide_or_show_section_questions!
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
  end

  private

  attr_reader :organization, :parent_card, :created_by

  def assign_attributes
    update_cached_cover
    clean_collection_card_attributes
    @collection.attributes = @attributes.except(:hardcoded_subtitle, :subtitle_hidden)
    @collection.update_cached_tag_lists
    # always touch the updated timestamp even though we may just be updating the related cards
    @collection.updated_at = Time.now
  end

  def mark_subcollection_as_private
    return unless @collection.anyone_can_view_changed?

    Sharing::PropagateAnyoneCanView.call(collection: @collection)

    return unless @collection.anyone_can_view_in_database && @collection.parent.anyone_can_view && !@collection.private?

    @collection.mark_as_private!
  end

  def update_cached_cover
    cover_hash = @collection.cache_cover.to_h
    cover_attrs = @attributes.slice(:hardcoded_subtitle, :subtitle_hidden).to_h.symbolize_keys
    return unless cover_attrs.present?

    cover_attrs.each do |k, v|
      cover_hash[k] = v
    end
    @collection.cached_cover = cover_hash
  end

  def clean_collection_card_attributes
    return unless @attributes[:collection_cards_attributes].present? &&
                  @attributes[:collection_cards_attributes].is_a?(Array)

    # remove any card_ids that are not valid from our attrs array
    # e.g. if they have been archived they will not show up in @collection.collection_cards
    @card_ids = @attributes[:collection_cards_attributes].map { |c| c[:id] }
    found_cards = @collection.collection_cards.where(id: @card_ids).select(:id, :pinned, :parent_id)
    found_ids = found_cards.map do |cc|
      # don't allow changing attributes of pinned/locked cards in template instance
      cc.id unless cc.pinned_and_locked?
    end.compact
    @attributes[:collection_cards_attributes].select! do |card_attr|
      found_ids.include?(card_attr[:id].to_i)
    end

    return unless @collection.templated?

    @attributes[:collection_cards_attributes].each do |card_attr|
      # don't allow changing this attr for template instances
      card_attr.delete :pinned
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
