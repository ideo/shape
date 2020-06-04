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

    after_create :add_template_tag, if: :master_template?, unless: :subtemplate?
    after_create :add_template_instance_tag, if: :templated?, unless: :subtemplate_instance?
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
  def setup_templated_collection(for_user:, collection:, synchronous: :async)
    # important that this is first so that the collection knows it is "templated"
    collection.update(template: self)
    return if collection_cards.blank?

    CollectionCardDuplicator.call(
      to_collection: collection,
      cards: collection_cards,
      for_user: for_user,
      building_template_instance: true,
      synchronous: synchronous,
    )
  end

  # This gets called upon:
  # - template card archive (CollectionCard.archive_all!)
  # - template card unarchive (Collection.unarchive_cards!)
  # - template card create (CollectionCardBuilder)
  # - template card resize/move (CollectionUpdater)
  # - duplicate template card (CollectionCard#duplicate)
  # - move template card (CardMover)
  # - pin template card (CardPinner)
  def queue_update_template_instances(updated_card_ids:, template_update_action:)
    # no need to queue up the job for nonexistent instances
    return unless master_template? && templated_collections.active.present?

    UpdateTemplateInstancesWorker.perform_async(id, updated_card_ids, template_update_action)
  end

  def update_test_template_instance_types!
    return unless is_a?(Collection::TestCollection)

    templated_collections.active.each do |instance|
      instance.update(
        collection_to_test_id: collection_to_test_id.nil? ? nil : instance.parent.id,
      )
      instance.hide_or_show_section_questions!
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

  def add_submission_box_tag
    tag(
      self,
      with: 'submission-template',
      on: :tags,
    )
    update_cached_tag_lists
    save
  end

  # is this collection made from a template?
  def templated?
    template_id.present?
  end

  def convert_to_template!
    all_child_collections.update_all(master_template: true, template_id: nil)
    CollectionCard
      .where(parent_id: [id] + all_child_collections.pluck(:id))
      .update_all(
        pinned: true,
        updated_at: Time.current,
      )
    update(master_template: true, template_id: nil)
  end
end
