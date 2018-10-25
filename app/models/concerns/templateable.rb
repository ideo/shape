module Templateable
  extend ActiveSupport::Concern

  included do
    acts_as_tagger
    has_many :templated_collections,
             class_name: 'Collection',
             foreign_key: :template_id,
             inverse_of: :template
    belongs_to :template,
               class_name: 'Collection',
               optional: true

    after_create :add_template_tag, if: :master_template?
    after_create :add_template_instance_tag, if: :templated?
  end

  def profile_template?
    return false unless master_template?
    organization.profile_template_id == id
  end

  def system_required?
    return false unless master_template?
    profile_template?
  end

  # copy all the cards from this template into a new collection
  def setup_templated_collection(for_user:, collection:)
    # important that this is first so that the collection knows it is "templated"
    collection.update(template: self)
    collection_cards.each do |cc|
      cc.duplicate!(
        for_user: for_user,
        parent: collection,
      )
    end
  end

  def queue_update_template_instances
    UpdateTemplateInstancesWorker.perform_async(id)
  end

  def update_template_instances
    templated_collections.active.each do |instance|
      move_cards_deleted_from_master_template(instance)
      update_cards_on_template_instance(instance)
      add_cards_from_master_template(instance)
      instance.reorder_cards!
      instance.touch
    end
  end

  def add_cards_from_master_template(instance)
    cards_added_to_master_template(instance).each do |card|
      card.duplicate!(
        for_user: instance.created_by,
        parent: instance,
      )
    end
  end

  def update_cards_on_template_instance(instance)
    master_cards = pinned_cards_by_id
    instance.collection_cards.pinned.each do |card|
      master = master_cards[card.templated_from_id]
      next if master.blank? # Blank if this card was just added
      card.update_columns(
        height: master.height,
        width: master.width,
        order: master.order,
      )
    end
  end

  def move_cards_deleted_from_master_template(instance)
    cards = cards_removed_from_master_template(instance)
    return unless cards.present?
    deleted_cards_coll = instance.find_or_create_deleted_cards_collection
    transaction do
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
          actor: created_by || instance.created_by,
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

  def find_or_create_deleted_cards_collection
    coll = collections.find_by(name: 'Deleted From Template')
    return coll if coll.present?
    builder = CollectionCardBuilder.new(
      params: {
        order: 0,
        collection_attributes: {
          name: 'Deleted From Template',
        },
      },
      parent_collection: self,
      user: created_by,
    )
    return builder.collection_card.record if builder.create
  end

  # The following methods map the difference between:
  # - pinned_cards on the master template
  # - instance cards where templated_from_id == pinned.id
  def cards_removed_from_master_template(instance)
    instance.templated_cards_by_templated_from_id.slice(
      *(instance.templated_cards_by_templated_from_id.keys - pinned_cards_by_id.keys),
    ).values
  end

  def cards_added_to_master_template(instance)
    pinned_cards_by_id.slice(
      *(pinned_cards_by_id.keys - instance.templated_cards_by_templated_from_id.keys),
    ).values
  end

  def templated_cards_by_templated_from_id
    @templated_cards_by_templated_from_id ||= collection_cards
    .where.not(templated_from: nil)
    .each_with_object({}) do |card, h|
      h[card.templated_from_id] = card
    end
  end

  def pinned_cards_by_id
    @pinned_cards_by_id ||= collection_cards
    .pinned
    .each_with_object({}) do |card, h|
      h[card.id] = card
    end
  end

  def add_template_tag
    # create the special #template tag
    tag(
      self,
      with: 'template',
      on: :tags,
    )
    update_cached_tag_lists
    # no good way around saving a 2nd time after_create
    save
  end

  def add_template_instance_tag
    # create the special #template tag
    tag(
      self,
      with: template.name.parameterize,
      on: :tags,
    )
    update_cached_tag_lists
    # no good way around saving a 2nd time after_create
    save
  end

  # is this collection made from a template?
  def templated?
    template_id.present?
  end
end
