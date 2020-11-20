class CardMover < SimpleService
  attr_reader :errors
  attr_reader :moving_cards

  def initialize(
    from_collection:,
    to_collection:,
    cards:,
    placement: 'beginning',
    card_action: 'move' # 'move' or 'link'
  )
    @from_collection = from_collection
    @to_collection = to_collection
    @placement = placement
    @card_action = card_action
    @should_update_from_cover = false
    # retain array of cards being moved
    @moving_cards = cards.to_a
    @existing_cards = []
    @pinned_cards = []
    @to_collection_cards = []
    @legend_items_to_duplicate = []
    @errors = []
  end

  def call
    return false if to_collection_invalid
    return false if @moving_cards.empty?

    select_existing_cards
    select_pinned_cards
    select_to_collection_cards
    duplicate_or_link_legend_items
    move_cards_to_board
    recalculate_cached_values
    update_template_instances
    assign_permissions
    @moving_cards
  end

  private

  def move?
    @card_action == 'move'
  end

  def link?
    @card_action == 'link'
  end

  def select_existing_cards
    cards = @to_collection.collection_cards
    cards = cards.unpinned unless @to_collection.master_template?
    @existing_cards = cards.to_a
  end

  def select_pinned_cards
    # for moving cards in a master template, all cards are pinned;
    # so we don't need to "lock" the existing pinned cards to the front
    return if @to_collection.master_template?

    @pinned_cards = @to_collection.collection_cards.pinned.to_a
  end

  def select_to_collection_cards
    if move?
      # minus any we're moving (i.e. moving within the same collection)
      @existing_cards.reject! { |card| @moving_cards.include? card }
      unless @to_collection == @from_collection
        @should_update_from_cover = @moving_cards.any?(&:should_update_parent_collection_cover?)
      end
    elsif link?
      # for links, we build new link cards out of our selected moving ones
      @moving_cards = @moving_cards.map(&:copy_into_new_link_card)
    end

    # create joined array with moving_cards either at beginning or end
    if @placement == 'beginning'
      @to_collection_cards = (@pinned_cards + @moving_cards + @existing_cards)
    elsif @placement == 'end'
      @to_collection_cards = (@pinned_cards + @existing_cards + @moving_cards)
    elsif @placement.is_a?(String) || @placement.is_a?(Integer)
      order = @placement.to_i
      # make sure order comes after any pinned cards
      last_pinned = @pinned_cards.last&.order || -1
      order = [last_pinned + 1, order].max
      # get the place in the array where we should insert our moving cards
      idx = @existing_cards.find_index { |c| c.order >= order }
      # default to the end of the array
      idx ||= @existing_cards.count
      combined = @existing_cards.insert(idx, @moving_cards).flatten
      @to_collection_cards = (@pinned_cards + combined).compact
    elsif @placement.respond_to?('[]')
      @placement_row = @placement['row']
      @placement_col = @placement['col']
      # error case
      return false unless @to_collection.board_collection?
    else
      # @placement format not found
      return false
    end

    # uniq the array because we may be moving within the same collection
    @to_collection_cards.uniq!
  end

  def move_cards_to_board
    return unless @to_collection.board_collection?

    CollectionGrid::BoardPlacement.call(
      to_collection: @to_collection,
      from_collection: @from_collection,
      moving_cards: @moving_cards,
      row: @placement_row,
      col: @placement_col,
    )
    # BoardPlacement does not save the records, just updates their attrs
    apply_updates_and_save_cards
  end

  def apply_updates_and_save_cards
    @moving_cards.each do |card|
      if @to_collection.master_template?
        # any cards created in master_template's pinned area become pinned
        # card.assign_attributes(pinned: pin_moving_cards)
        if card.primary? && card.collection.present?
          card.collection.convert_to_template!
        end
      elsif @to_collection != @from_collection
        card.assign_attributes(pinned: false)
      end
      if @to_collection.anyone_can_view? && card.primary? && card.collection.present?
        collection = card.collection
        collection.update(anyone_can_view: true)
        Sharing::PropagateAnyoneCanView.call(collection: collection)
      end

      if card.changed? && card.board_placement_is_valid?
        @should_update_to_cover ||= card.should_update_parent_collection_cover?
        card.save
      end
    end
  end

  def recalculate_cached_values
    unless link? || @from_collection == @to_collection
      @from_collection.touch
      @from_collection.cache_card_count!
      @from_collection.cache_cover! if @should_update_from_cover
    end
    @to_collection.cache_cover! if @should_update_to_cover
    @to_collection.recalculate_child_breadcrumbs_async(@moving_cards)
    @to_collection.cache_card_count!
  end

  def update_template_instances
    if @to_collection == @from_collection && @from_collection.master_template?
      @from_collection.queue_update_template_instances(
        updated_card_ids: @from_collection.collection_cards.pluck(:id),
        template_update_action: :update_card_attributes,
      )
      return
    end

    if @from_collection.master_template?
      @from_collection.queue_update_template_instances(
        updated_card_ids: @moving_cards.pluck(:id),
        template_update_action: :archive,
      )
    end

    return unless @to_collection.master_template?

    @to_collection.queue_update_template_instances(
      updated_card_ids: @moving_cards.pluck(:id),
      template_update_action: :create,
    )
  end

  def duplicate_or_link_legend_items
    mover = LegendMover.new(
      to_collection: @to_collection,
      cards: @to_collection_cards,
      action: @card_action,
    )
    return unless mover.call

    @moving_cards += mover.legend_item_cards
    @to_collection_cards += mover.legend_item_cards
  end

  def to_collection_invalid
    # these only apply for moving actions
    return unless move?

    if @to_collection.num_columns < 16 && @moving_cards.any?(&:section?)
      @errors << 'You can\'t move a section into a normal collection.'
      return true
    end

    # Not allowed to move between organizations
    if @to_collection.organization_id != @from_collection.organization_id
      @errors << 'You can\'t move a collection to a different organization.'
      return true
    end
    # NOTE: recalculate_breadcrumb! probably unnecessary; just to be safe
    @to_collection.recalculate_breadcrumb!
    @from_collection.recalculate_breadcrumb!
    @moving_cards.each do |card|
      next if card.link?

      collection = card.collection
      next unless collection.present?

      if @to_collection.within_collection_or_self?(collection.id)
        @errors << 'You can\'t move a collection inside of itself.'
        return true
      end
      if @to_collection.inside_a_master_template? && collection.any_template_instance_children?
        @errors << 'You can\'t move an instance of a template inside a master template.'
        return true
      end
    end
    false
  end

  def assign_permissions
    return if @to_collection == @from_collection
    return unless move?

    @moving_cards.each do |card|
      next if card.link? || card.placeholder? || card.section? || card.record.nil?
      # private records remain private, do not alter their permissions
      next if card.record.private?

      Roles::MergeToChild.call(parent: @to_collection, child: card.record)
    end
  end
end
