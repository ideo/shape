class CardMover
  attr_reader :to_collection, :errors

  def initialize(from_collection:, to_collection:, card_ids:, placement: 'beginning')
    @from_collection = from_collection
    @to_collection = to_collection
    @card_ids = card_ids
    @placement = placement
    # retain array of cards being moved
    @moving_cards = @from_collection.collection_cards.where(id: @card_ids).to_a
    @errors = []

    # puts "from_collection #{@from_collection.id}"
    # puts "to_collection #{@to_collection.id}"
  end

  def call
    move_cards
    assign_permissions
  end

  private

  def move_cards
    # get original cards
    existing_cards = @to_collection.collection_cards.to_a
    joined_cards = []
    # created joined array with moving_cards either at beginning or end
    if @placement == 'beginning'
      joined_cards = (@moving_cards + existing_cards)
    else
      joined_cards = (existing_cards + @moving_cards)
    end
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
    # puts "@moving_cards #{@moving_cards.collect{|c| [c.id, c.parent_id]}}"
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
