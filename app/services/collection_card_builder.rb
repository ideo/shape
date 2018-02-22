class CollectionCardBuilder
  attr_reader :collection_card, :errors

  def initialize(params:, collection: nil, user: nil)
    @collection_card = collection.collection_cards.build(params)
    @user = user
    @collection = collection
    @errors = []
  end

  def create
    create_collection_card
  end

  private

  def create_collection_card
    result = @collection_card.save
    if result
      if @collection_card.collection.present?
        @user.add_role(Role::EDITOR, collection_card.collection)
      end
      @collection_card.record.reload.recalculate_breadcrumb!
    end
    result
  end
end
