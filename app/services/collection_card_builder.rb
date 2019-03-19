class CollectionCardBuilder
  attr_reader :collection_card, :errors

  def initialize(params:, parent_collection:, user: nil, type: 'primary')
    @params = params
    @collection_card = parent_collection.send("#{type}_collection_cards").build(params)
    @errors = @collection_card.errors
    @user = user
    @parent_collection = parent_collection
  end

  def create
    hide_helper_for_user
    if @collection_card.record.present?
      # capture this here before `save` is called at which point the accessor will be nil
      @external_id = @collection_card.record.external_id
      create_collection_card
    else
      @collection_card.errors.add(:record, "can't be blank")
      false
    end
  end

  private

  def hide_helper_for_user
    # if the user has "show_helper" then set it to false, now that they've created a card
    return unless @user.try(:show_helper)
    @user.update(show_helper: false)
  end

  def create_collection_card
    # NOTE: for now you can *only* create pinned cards in a master template
    @collection_card.pinned = true if @collection_card.master_template_card?
    # TODO: rollback transaction if these later actions fail; add errors, return false
    CollectionCard.transaction do
      @collection_card.save.tap do |result|
        if result
          record = @collection_card.record
          record.inherit_roles_anchor_from_parent!
          if @collection_card.record_type == :collection
            # NOTE: should items created in My Collection get this access as well?
            # this will change the roles_anchor, which will get re-cached later
            record.enable_org_view_access_if_allowed(@parent_collection)
            record.update(created_by: @user) if @user.present?
          end
          @collection_card.parent.cache_cover! if @collection_card.should_update_parent_collection_cover?
          @collection_card.update_collection_cover if @collection_card.is_cover
          @collection_card.increment_card_orders!
          add_external_record
          record.reload
          # will also cache roles identifier and update breadcrumb
          record.save

          if record.is_a?(Item::FileItem) && record.video?
            record.transcode!
          end

          if @parent_collection.is_a? Collection::SubmissionsCollection
            @parent_collection.follow_submission_box(@user)
          end

          if @parent_collection.master_template?
            # we just added a template card, so update the instances
            @parent_collection.queue_update_template_instances
          end
        end
      end
    end
  end

  def add_external_record
    return unless @external_id.present? && @user.application.present?
    @collection_card.record.add_external_id(
      @external_id,
      @user.application.id,
    )
  end
end
