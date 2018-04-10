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

    @collection_card.save.tap do |result|
      if result
        # TODO: rollback transaction if these later actions fail; add errors, return false
        @collection_card.record.inherit_roles_from_parent!
        # NOTE: should items created in My Collection get this access as well?
        if @collection_card.record_type == :collection
          @collection_card.record.allow_primary_group_view_access
          @collection_card.record.update(created_by: @user)
        end
        @collection_card.increment_card_orders!
        @collection_card.record.reload.recalculate_breadcrumb!
        # mark the collection as recently updated
        @parent_collection.touch
      end
    end
  end
end
