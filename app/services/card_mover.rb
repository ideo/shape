class CardMover
  attr_reader :errors

  def initialize(
    from_collection:,
    to_collection:,
    cards:,
    placement: 'beginning',
    card_action: 'move'
  )
    @from_collection = from_collection
    @to_collection = to_collection
    @placement = placement
    # retain array of cards being moved
    @moving_cards = cards.to_a
    @card_action = card_action
    @errors = []
  end

  def call
    return false if to_collection_invalid
    move_cards
    assign_permissions if @card_action == 'move'
    @moving_cards
  end

  private

  def move_cards
    # get original cards in the destination
    existing_cards = @to_collection.collection_cards.to_a
    # track if we should update their collection covers
    should_update_from_cover = false
    should_update_to_cover = false
    if @card_action == 'move'
      # minus any we're moving (i.e. moving within the same collection)
      existing_cards.reject! { |card| @moving_cards.include? card }
      unless @to_collection == @from_collection
        should_update_from_cover = @moving_cards.any?(&:should_update_parent_collection_cover?)
      end
    elsif @card_action == 'link'
      # for links, we build new link cards out of our selected moving ones
      @moving_cards = @moving_cards.map(&:copy_into_new_link_card)
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
      card.assign_attributes(parent_id: @to_collection.id, order: i)
      should_update_to_cover ||= card.should_update_parent_collection_cover? if card.changed?
      card.save if card.changed?
    end

    @from_collection.reload.reorder_cards! unless @from_collection == @to_collection
    @from_collection.cache_cover! if should_update_from_cover
    @to_collection.cache_cover! if should_update_to_cover
    @moving_cards
  end

  def to_permissions
    {
      Role::EDITOR => @to_collection.editors,
      Role::VIEWER => @to_collection.viewers,
    }
  end

  def to_collection_invalid
    # NOTE: recalculate_breadcrumb! could be made unnecessary if we had better
    # checks for recalculating breadcrumb in other places
    @to_collection.recalculate_breadcrumb!
    @from_collection.recalculate_breadcrumb!
    @moving_cards.each do |card|
      record = card.record
      if @to_collection.breadcrumb_contains?(klass: record.class.name, id: record.id)
        @errors << 'You can\'t move a collection inside of itself.'
        return true
      end
    end
    false
  end

  def assign_permissions
    @moving_cards.each do |card|
      # assign each role from the @to_collection to our newly moved cards
      to_permissions.each do |role_name, entity|
        Roles::MassAssign.new(
          object: card.record,
          role_name: role_name,
          users: entity[:users],
          groups: entity[:groups],
          propagate_to_children: true,
        ).call
      end
    end
  end
end
