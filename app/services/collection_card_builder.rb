class CollectionCardBuilder
  attr_reader :collection_card, :errors

  def initialize(params:, parent_collection: nil, user: nil, type: 'primary')
    @collection_card = parent_collection.send("#{type}_collection_cards").build(params)
    @errors = @collection_card.errors
    @user = user
    @parent_collection = parent_collection
  end

  def create
    create_collection_card
  end

  private

  def create_collection_card
    if @collection_card.record.blank?
      @collection_card.errors.add(:record, "can't be blank")
      return false
    end

    # TODO: rollback transaction if these later actions fail; add errors, return false
    @collection_card.save.tap do |result|
      if result
        record = @collection_card.record
        record.inherit_roles_from_parent!
        if @collection_card.record_type == :collection
          # NOTE: should items created in My Collection get this access as well?
          record.allow_primary_group_view_access if record.parent_is_user_collection?
          record.update(created_by: @user)
        end
        @collection_card.parent.cache_cover! if @collection_card.should_update_parent_collection_cover?
        @collection_card.increment_card_orders!
        record.reload.recalculate_breadcrumb!
      end
    end
  end
end
