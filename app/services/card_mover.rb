class CardMover
  def initialize(from_collection:, to_collection:, card_ids:, placement: 'beginning')
    @from_collection = from_collection
    @to_collection = to_collection
    @card_ids = card_ids
    @placement = placement
    # retain array of cards being moved
    @moving_cards = @from_collection.collection_cards.where(id: @card_ids).to_a
  end

  def call
    move_cards
    assign_permissions
  end

  def errors
    # will this be useful?
    @moving_cards.map(&:errors).flatten
  end

  private

  def move_cards
    # get original cards, minus any we're moving
    existing_cards = @to_collection.collection_cards.to_a.reject do |card|
      @moving_cards.include? card
    end
    joined_cards = []
    # created joined array with moving_cards either at beginning or end
    if @placement == 'beginning'
      joined_cards = (@moving_cards + existing_cards)
    else
      joined_cards = (existing_cards + @moving_cards)
    end
    # uniq the array because we may be moving within the same collection
    joined_cards.uniq!
    # Reorder all cards based on order of joined_cards
    joined_cards.each_with_index do |card, i|
      # parent_id will already be set for existing_cards but no harm to indicate
      card.update(parent_id: @to_collection.id, order: i)
    end
    @moving_cards
  end

  def to_permissions
    {
      Role::EDITOR => @to_collection.editors,
      Role::VIEWER => @to_collection.viewers,
    }
  end

  def assign_permissions
    @moving_cards.each do |card|
      # assign each role from the @to_collection to our newly moved cards
      to_permissions.each do |role_name, users|
        Roles::AssignToUsers.new(
          object: card.record,
          role_name: role_name,
          users: users,
          propagate_to_children: true,
        ).call
      end
    end
  end
end
