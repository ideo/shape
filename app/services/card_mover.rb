class CardMover
  attr_reader :errors
  attr_reader :moving_cards

  def initialize(
    from_collection:,
    to_collection:,
    cards:,
    placement: 'beginning',
    card_action: 'move', # 'move' or 'link'
    user_initiated: true
  )
    @from_collection = from_collection
    @to_collection = to_collection
    @placement = placement
    # retain array of cards being moved
    @moving_cards = cards.to_a
    @card_action = card_action
    @user_initiated = user_initiated
    @errors = []
  end

  def call
    return false if to_collection_invalid
    gather_cards_in_destination
    move_cards
    recalculate_cached_values
    update_template_instances
    assign_permissions if @card_action == 'move' && @user_initiated
    @moving_cards
  end

  private

  def gather_cards_in_destination
    if @to_collection.master_template?
      # for moving cards in a master template, all cards are pinned;
      # so we don't need to "lock" the existing pinned cards to the front
      @pinned_cards = []
      @existing_cards = @to_collection.collection_cards.to_a
    else
      @pinned_cards = @to_collection.collection_cards.pinned.to_a
      @existing_cards = @to_collection.collection_cards.unpinned.to_a
    end
  end

  def move_cards
    # track if we should update their collection covers
    @should_update_from_cover = false
    @should_update_to_cover = false
    if @card_action == 'move'
      # minus any we're moving (i.e. moving within the same collection)
      @existing_cards.reject! { |card| @moving_cards.include? card }
      unless @to_collection == @from_collection
        @should_update_from_cover = @moving_cards.any?(&:should_update_parent_collection_cover?)
      end
    elsif @card_action == 'link'
      # for links, we build new link cards out of our selected moving ones
      @moving_cards = @moving_cards.map(&:copy_into_new_link_card)
    end
    joined_cards = []
    # created joined array with moving_cards either at beginning or end
    if @placement == 'beginning'
      joined_cards = (@pinned_cards + @moving_cards + @existing_cards)
    else
      joined_cards = (@pinned_cards + @existing_cards + @moving_cards)
    end
    # uniq the array because we may be moving within the same collection
    joined_cards.uniq!
    # Reorder all cards based on order of joined_cards
    joined_cards.each_with_index do |card, i|
      # parent_id will already be set for existing_cards but no harm to indicate
      card.assign_attributes(parent_id: @to_collection.id, order: i)
      if @to_collection.master_template?
        # currently any cards created in master_templates become pinned
        card.assign_attributes(pinned: true)
      end
      if card.changed?
        @should_update_to_cover ||= card.should_update_parent_collection_cover?
        card.save
      end
    end
    @moving_cards
  end

  def recalculate_cached_values
    unless @card_action == 'link' || @from_collection == @to_collection
      @from_collection.touch
      @from_collection.reload.reorder_cards!
      @from_collection.cache_card_count!
    end
    @from_collection.cache_cover! if @should_update_from_cover
    @to_collection.cache_cover! if @should_update_to_cover
    @to_collection.recalculate_child_breadcrumbs(@moving_cards)
    @to_collection.cache_card_count!
  end

  def update_template_instances
    @from_collection.queue_update_template_instances if @from_collection.master_template?
    @to_collection.queue_update_template_instances if @to_collection.master_template?
  end

  def to_permissions
    {
      Role::EDITOR => @to_collection.editors,
      Role::VIEWER => @to_collection.viewers,
    }
  end

  def to_collection_invalid
    # these only apply for moving actions
    return unless @card_action == 'move'
    # Not allowed to move between organizations
    if @to_collection.organization_id != @from_collection.organization_id
      @errors << 'You can\'t move a collection to a different organization.'
      return true
    end
    # NOTE: recalculate_breadcrumb! probably unnecessary; just to be safe
    @to_collection.recalculate_breadcrumb!
    @from_collection.recalculate_breadcrumb!
    @moving_cards.each do |card|
      collection = card.collection
      next unless collection.present?
      if @to_collection.within_collection_or_self?(collection)
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

  def set_test_as_template

  end
end
