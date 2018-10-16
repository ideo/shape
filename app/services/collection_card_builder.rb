class CollectionCardBuilder
  attr_reader :collection_card, :errors

  def initialize(params:, parent_collection:, user: nil, type: 'primary', replacing_card: nil)
    @collection_card = parent_collection.send("#{type}_collection_cards").build(params)
    @errors = @collection_card.errors
    @user = user
    @parent_collection = parent_collection
    @replacing_card = replacing_card
  end

  def create
    hide_helper_for_user
    if @collection_card.record.present?
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
    if @replacing_card.present?
      @collection_card.pinned = @replacing_card.pinned
      @collection_card.templated_from_id = @replacing_card.templated_from_id
    end

    # TODO: rollback transaction if these later actions fail; add errors, return false
    @collection_card.save.tap do |result|
      if result
        record = @collection_card.record
        record.inherit_roles_from_parent!
        if @collection_card.record_type == :collection
          # NOTE: should items created in My Collection get this access as well?
          record.enable_org_view_access_if_allowed(@parent_collection)
          record.update(created_by: @user)
        end
        @collection_card.parent.cache_cover! if @collection_card.should_update_parent_collection_cover?
        @collection_card.increment_card_orders!
        record.reload.recalculate_breadcrumb!
      end
    end
  end
end
