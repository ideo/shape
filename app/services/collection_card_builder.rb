class CollectionCardBuilder
  attr_reader :collection_card, :errors

  def initialize(params:, collection: nil, user: nil)
    @collection_card = collection.collection_cards.build(params)
    @errors = @collection_card.errors
    @user = user
    @collection = collection
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
        if @collection_card.collection.present?
          @user.add_role(Role::EDITOR, @collection_card.collection.becomes(Collection))
        elsif @collection_card.item.present?
          @user.add_role(Role::EDITOR, @collection_card.item.becomes(Item))
        end
        @collection_card.increment_card_orders!
        @collection_card.record.reload.recalculate_breadcrumb!
      end
    end
  end
end
