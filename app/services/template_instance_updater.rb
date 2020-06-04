class TemplateInstanceUpdater
  def initialize(master_template:, updated_card_ids:, template_update_action:)
    @master_template = master_template
    @updated_card_ids = updated_card_ids
    @template_update_action = template_update_action.to_sym
  end

  def call
    update_template_instances
  end

  def update_template_instances
    return unless @updated_card_ids.any?

    templated_collections = @master_template.templated_collections.active

    case @template_update_action
    when :update_all
      templated_collections.find_each { |i| update_all_templated_cards_for_instance(i) }
    when :update_card_attributes
      templated_collections.find_each { |i| update_all_card_attributes_for_instance(i) }
    when :archive
      templated_collections.find_each { |i| move_cards_archived_from_master_template(i) }
    when :create, :duplicate, :pin, :unarchive
      templated_collections.find_each { |i| insert_or_update_instance_cards(i) }
    when :update_text_content, :update_question_content
      # a single card is being passed through for these actions
      updated_card_id = @updated_card_ids.first
      return unless updated_card_id.present?

      templated_collections.find_each { |i| update_templated_card_for_instance(updated_card_id, i) }
    else
      return
    end

    return unless @master_template.submission_box_template_test?

    # method in test_collection to update all submissions
    @master_template.update_submissions_launch_status
  end

  private

  def update_all_templated_cards_for_instance(instance)
    update_instance_cards_by_templated_from_ids(@updated_card_ids, instance)
  end

  def update_all_card_attributes_for_instance(instance)
    update_instance_card_attributes_by_templated_from_ids(@updated_card_ids, instance)
  end

  def insert_or_update_instance_cards(instance)
    find_and_move_or_create_instance_cards(@updated_card_ids, instance)
    update_instance_cards_by_templated_from_ids(@updated_card_ids, instance)
  end

  def move_cards_archived_from_master_template(instance)
    move_cards_to_deleted_from_collection(@updated_card_ids, instance)
    update_instance_cards_by_templated_from_ids(@master_template.collection_cards.pluck(:id), instance)
  end

  def update_instance_cards_by_templated_from_ids(templated_from_ids, instance)
    templated_from_ids.each do |id|
      master_card = @master_template.collection_cards.find { |master_cards| master_cards.id == id }
      card_within_instance = instance.collection_cards.find { |instance_cards| instance_cards.templated_from_id == id }

      next if master_card.blank? || card_within_instance.blank?

      TemplateInstanceCard::TemplateInstanceCardUpdater.call(
        instance_card: card_within_instance,
        master_card: master_card,
        master_template: @master_template,
      )
    end

    instance.reorder_cards!
    instance.touch
  end

  def update_instance_card_attributes_by_templated_from_ids(templated_from_ids, instance)
    templated_from_ids.each do |id|
      master_card = @master_template.collection_cards.find { |master_cards| master_cards.id == id }
      card_within_instance = instance.collection_cards.find { |instance_cards| instance_cards.templated_from_id == id }

      next if master_card.blank? || card_within_instance.blank?

      card_within_instance.copy_card_attributes!(master_card)
    end

    instance.reorder_cards!
    instance.touch
  end

  def update_templated_card_for_instance(templated_from_id, instance)
    master_card = @master_template.collection_cards.find { |master_cards| master_cards.id == templated_from_id }
    card_within_instance = instance.collection_cards.find { |instance_cards| instance_cards.templated_from_id == templated_from_id }
    return unless master_card.present? && card_within_instance.present?

    case @template_update_action
    when :update_text_content
      return unless card_within_instance.item.is_a?(Item::TextItem)

      TemplateInstanceCard::TemplateInstanceTextCardUpdater.call(
        instance_card: card_within_instance,
        master_card: master_card,
      )
    when :update_question_content
      return unless @master_template.is_a?(Collection::TestCollection) && @master_template.inside_a_submission_box_template?

      TemplateInstanceCard::TemplateInstanceQuestionCardUpdater.call(
        instance_card: card_within_instance,
        master_card: master_card,
      )
    else
      return
    end
  end

  def add_cards_from_master_template(adding_cards, instance)
    cards_to_add = []
    adding_cards.each do |id|
      master_card = @master_template.collection_cards.find { |master_cards| master_cards.id == id }
      # ABORT: should not allow duplicating a template instance in this manner;
      # this could lead to infinite loops. (similar to note above)
      next if master_card.record.try(:templated?)

      cards_to_add.push(master_card)
    end

    return if cards_to_add.empty?

    CollectionCardDuplicator.call(
      for_user: instance.created_by,
      to_collection: instance,
      building_template_instance: true,
      cards: cards_to_add,
      synchronous: :first_level,
      placement: 'end',
    )
  end

  def move_cards_to_deleted_from_collection(moving_to_deleted_ids, instance)
    cards = instance.collection_cards.select { |cc| moving_to_deleted_ids.include? cc.templated_from_id }
    return unless cards.present?

    if instance.is_a?(Collection::TestCollection)
      # for tests, we just delete any pinned cards that were removed from the master
      CollectionCard.where(id: cards.pluck(:id)).destroy_all
      return
    end
    deleted_cards_coll = find_or_create_deleted_cards_collection(instance)

    ActiveRecord::Base.transaction do
      # TODO: do something here if the cards already exist in the deleted coll?
      # e.g. when template editor archives/unarchives cards
      card_mover = CardMover.new(
        from_collection: instance,
        to_collection: deleted_cards_coll,
        cards: cards,
        placement: 'end',
        card_action: 'move',
      )
      moved_cards = card_mover.call
      # card_mover will return false if error
      return false unless moved_cards

      # Unpin all cards so user can edit
      CollectionCard.where(
        id: moved_cards.map(&:id),
      ).update_all(pinned: false)

      # Notify that cards have been moved
      moved_cards.each do |card|
        ActivityAndNotificationBuilder.call(
          # TODO: this should really be whoever initiated the action
          actor: @master_template.created_by || instance.created_by,
          organization: instance.organization,
          target: instance, # Assign as target so we can route to it
          action: :archived_from_template,
          subject_user_ids: card.record.editors[:users].pluck(:id),
          subject_group_ids: card.record.editors[:groups].pluck(:id),
          source: card.record,
        )
      end
    end
  end

  def find_or_create_deleted_cards_collection(instance)
    deleted_from_template_collection = instance.collections.find_by(name: 'Deleted From Template')
    return deleted_from_template_collection if deleted_from_template_collection.present?

    # add deleted_from_template_collection to the end of the collection
    last_card = instance.collection_cards.last
    last_card_order = last_card.present? ? last_card.order + 1 : 0

    builder = CollectionCardBuilder.new(
      params: {
        order: last_card_order,
        collection_attributes: {
          name: 'Deleted From Template',
        },
        pinned: false,
      },
      parent_collection: instance,
      user: instance.created_by,
    )

    return builder.collection_card.record if builder.create
  end

  def find_and_move_or_create_instance_cards(moving_card_ids, instance)
    all_cards_within_instance = CollectionCard
                                .joins(:parent)
                                .where(
                                  Collection
                                    .arel_table[:id]
                                    .in([instance.id] + Collection.in_collection(instance).pluck(:id)),
                                )

    add_card_ids = []
    moving_card_ids.each do |moving_card_id|
      card_within_instance = all_cards_within_instance.where(templated_from_id: moving_card_id).first

      if card_within_instance.present?
        next if card_within_instance.parent == instance # skip if card is already in top-level instance

        # find and move card within instance
        card_mover = CardMover.new(
          from_collection: card_within_instance.parent,
          to_collection: instance,
          cards: [card_within_instance],
          placement: 'end',
          card_action: 'move',
        )

        card_mover.call

        next unless card_within_instance.archived?

        card_within_instance.unarchive!
      else
        # duplicate master card into instance if unarchived card is no longer in instance
        add_card_ids.push(moving_card_id)
      end
    end
    add_cards_from_master_template(add_card_ids, instance) if add_card_ids.present?
    # NOTE: may need to archive empty 'Deleted From Collection' collection
  end
end
