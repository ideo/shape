# == Schema Information
#
# Table name: collections
#
#  id                             :bigint(8)        not null, primary key
#  anyone_can_join                :boolean          default(FALSE)
#  anyone_can_view                :boolean          default(FALSE)
#  archive_batch                  :string
#  archived                       :boolean          default(FALSE)
#  archived_at                    :datetime
#  breadcrumb                     :jsonb
#  cached_attributes              :jsonb
#  cached_test_scores             :jsonb
#  collection_type                :integer          default("collection")
#  cover_type                     :integer          default("cover_type_default")
#  hide_submissions               :boolean          default(FALSE)
#  master_template                :boolean          default(FALSE)
#  name                           :string
#  num_columns                    :integer
#  processing_status              :integer
#  search_term                    :string
#  shared_with_organization       :boolean          default(FALSE)
#  submission_box_type            :integer
#  submissions_enabled            :boolean          default(TRUE)
#  test_closed_at                 :datetime
#  test_launched_at               :datetime
#  test_show_media                :boolean          default(TRUE)
#  test_status                    :integer
#  type                           :string
#  unarchived_at                  :datetime
#  created_at                     :datetime         not null
#  updated_at                     :datetime         not null
#  challenge_admin_group_id       :integer
#  challenge_participant_group_id :integer
#  challenge_reviewer_group_id    :integer
#  cloned_from_id                 :bigint(8)
#  collection_to_test_id          :bigint(8)
#  created_by_id                  :integer
#  default_group_id               :integer
#  idea_id                        :integer
#  joinable_group_id              :bigint(8)
#  organization_id                :bigint(8)
#  question_item_id               :integer
#  roles_anchor_collection_id     :bigint(8)
#  submission_box_id              :bigint(8)
#  submission_template_id         :integer
#  survey_response_id             :integer
#  template_id                    :integer
#  test_collection_id             :bigint(8)
#  id                         :bigint(8)        not null, primary key
#  anyone_can_join            :boolean          default(FALSE)
#  anyone_can_view            :boolean          default(FALSE)
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  cached_test_scores         :jsonb
#  collection_type            :integer          default("collection")
#  cover_type                 :integer          default("cover_type_default")
#  end_date                   :datetime
#  hide_submissions           :boolean          default(FALSE)
#  master_template            :boolean          default(FALSE)
#  name                       :string
#  num_columns                :integer
#  processing_status          :integer
#  search_term                :string
#  shared_with_organization   :boolean          default(FALSE)
#  start_date                 :datetime
#  submission_box_type        :integer
#  submissions_enabled        :boolean          default(TRUE)
#  test_closed_at             :datetime
#  test_launched_at           :datetime
#  test_show_media            :boolean          default(TRUE)
#  test_status                :integer
#  type                       :string
#  unarchived_at              :datetime
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  cloned_from_id             :bigint(8)
#  collection_to_test_id      :bigint(8)
#  created_by_id              :integer
#  default_group_id           :integer
#  idea_id                    :integer
#  joinable_group_id          :bigint(8)
#  organization_id            :bigint(8)
#  question_item_id           :integer
#  roles_anchor_collection_id :bigint(8)
#  submission_box_id          :bigint(8)
#  submission_template_id     :integer
#  survey_response_id         :integer
#  template_id                :integer
#  test_collection_id         :bigint(8)
#
# Indexes
#
#  index_collections_on_archive_batch               (archive_batch)
#  index_collections_on_breadcrumb                  (breadcrumb) USING gin
#  index_collections_on_cached_test_scores          (cached_test_scores) USING gin
#  index_collections_on_cloned_from_id              (cloned_from_id)
#  index_collections_on_created_at                  (created_at)
#  index_collections_on_idea_id                     (idea_id)
#  index_collections_on_organization_id             (organization_id)
#  index_collections_on_roles_anchor_collection_id  (roles_anchor_collection_id)
#  index_collections_on_submission_box_id           (submission_box_id)
#  index_collections_on_submission_template_id      (submission_template_id)
#  index_collections_on_template_id                 (template_id)
#  index_collections_on_test_status                 (test_status)
#  index_collections_on_type                        (type)
#
# Foreign Keys
#
#  fk_rails_...  (organization_id => organizations.id)
#

class Collection < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable
  include RealtimeEditorsViewers
  include HasActivities
  include Templateable
  include Testable
  include Externalizable
  include Commentable
  include Globalizable
  include CachedAttributes

  resourceable roles: [Role::EDITOR, Role::CONTENT_EDITOR, Role::VIEWER],
               edit_role: Role::EDITOR,
               content_edit_role: Role::CONTENT_EDITOR,
               view_role: Role::VIEWER

  archivable as: :parent_collection_card,
             with: %i[collection_cards cards_linked_to_this_collection]
  acts_as_taggable
  acts_as_taggable_on :users

  translates_custom :translated_name,
                    confirmable: true,
                    fallbacks_for_empty_translations: true

  # has to come after `translates_custom`
  include Translatable

  store_accessor :cached_attributes,
                 :cached_cover,
                 :cached_tag_list,
                 :cached_user_list,
                 :cached_owned_tag_list,
                 :cached_card_count,
                 :cached_activity_count,
                 :submission_attrs,
                 :getting_started_shell,
                 :loading_content,
                 :cached_inheritance,
                 :common_viewable,
                 :broadcasting

  # validations
  validates :name, presence: true
  validate :prevent_template_instance_inside_master_template

  # callbacks
  before_validation :inherit_parent_organization_id, on: :create
  before_validation :set_joinable_guest_group, on: :update, if: :will_save_change_to_anyone_can_join?
  before_save :add_viewer_to_joinable_group, if: :will_save_change_to_joinable_group_id?
  before_save :create_challenge_groups_and_assign_roles, if: :will_become_a_challenge?
  after_touch :touch_related_cards, unless: :destroyed?
  after_commit :touch_related_cards, if: :saved_change_to_updated_at?, unless: :destroyed?
  after_commit :rename_challenge_groups, if: :saved_change_to_name?, unless: :destroyed?
  after_commit :reindex_sync, on: :create
  after_commit :reindex_after_archive, if: :saved_change_to_archived?
  after_save :pin_all_primary_cards, if: :now_master_template?

  # all cards including archived (i.e. undo default :collection_cards scope)
  has_many :all_collection_cards,
           class_name: 'CollectionCard',
           foreign_key: :parent_id,
           inverse_of: :parent,
           dependent: :destroy

  # all active cards including links
  # i.e. this is what is displayed in the frontend for collection.collection_cards
  has_many :collection_cards,
           -> { active.ordered },
           class_name: 'CollectionCard',
           foreign_key: :parent_id,
           inverse_of: :parent

  # cards where the item/collection "lives" in this collection
  has_many :primary_collection_cards,
           -> { active.ordered },
           class_name: 'CollectionCard::Primary',
           foreign_key: :parent_id,
           inverse_of: :parent

  # cards where the item/collection is linked into this collection
  has_many :link_collection_cards,
           -> { active.ordered },
           class_name: 'CollectionCard::Link',
           foreign_key: :parent_id,
           inverse_of: :parent

  has_many :hidden_collection_cards,
           -> { active.hidden },
           class_name: 'CollectionCard::Primary',
           foreign_key: :parent_id,
           inverse_of: :parent

  # cards that live outside this collection, linking to this collection
  has_many :cards_linked_to_this_collection,
           class_name: 'CollectionCard::Link',
           inverse_of: :collection,
           dependent: :destroy

  # the card that represents this collection in its parent, and determines its breadcrumb
  has_one :parent_collection_card,
          class_name: 'CollectionCard::Primary',
          inverse_of: :collection,
          dependent: :destroy

  # all primary + link collection cards that contain this collection
  has_many :parent_collection_cards,
           class_name: 'CollectionCard',
           inverse_of: :collection

  has_many :collection_cover_cards,
           -> { active.is_cover.ordered },
           class_name: 'CollectionCard::Primary',
           foreign_key: :parent_id,
           inverse_of: :parent

  has_many :collection_cover_text_items,
           -> { text_items },
           through: :hidden_collection_cards,
           source: :item

  has_many :items, through: :primary_collection_cards
  has_many :collections, through: :primary_collection_cards
  has_many :items_and_linked_items,
           through: :collection_cards,
           source: :item
  has_many :collections_and_linked_collections,
           through: :collection_cards,
           source: :collection
  has_many :collection_cover_items,
           through: :collection_cover_cards,
           source: :item
  has_many :data_items,
           -> { data_items },
           source: :item,
           class_name: 'Item::DataItem',
           through: :primary_collection_cards
  has_many :collection_filters

  delegate :parent, :pinned, :pinned?, :pinned_and_locked?,
           to: :parent_collection_card, allow_nil: true

  belongs_to :organization
  belongs_to :cloned_from, class_name: 'Collection', optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :question_item, class_name: 'Item::QuestionItem', optional: true
  belongs_to :joinable_group, class_name: 'Group', optional: true
  belongs_to :challenge_admin_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true
  belongs_to :challenge_reviewer_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true
  belongs_to :challenge_participant_group,
             class_name: 'Group',
             dependent: :destroy,
             optional: true

  scope :root, -> { where('jsonb_array_length(breadcrumb) = 1') }
  scope :not_custom_type, -> { where(type: nil) }
  scope :user_collection, -> { where(type: 'Collection::UserCollection') }
  scope :application_collection, -> { where(type: 'Collection::ApplicationCollection') }
  scope :shared_with_me, -> { where(type: 'Collection::SharedWithMeCollection') }
  scope :searchable, -> { where.not(type: unsearchable_types).or(not_custom_type) }
  scope :data_collectable, -> { where.not(type: uncollectable_types).or(not_custom_type) }
  scope :master_template, -> { where(master_template: true) }

  accepts_nested_attributes_for :collection_cards

  enum processing_status: {
    processing_breadcrumb: 1,
    duplicating: 2,
  }

  enum cover_type: {
    cover_type_default: 0,
    cover_type_items: 1,
    cover_type_text_and_media: 2,
    cover_type_carousel: 3,
  }

  enum collection_type: {
    collection: 0,
    project: 1,
    method: 2,
    prototype: 3,
    profile: 4, # Different from UserProfile
    phase: 5,
    challenge: 6,
  }, _prefix: true

  # Searchkick Config
  # Use queue to bulk reindex every 1m (with Sidekiq Scheduled Job/ActiveJob)
  searchkick callbacks: :queue

  # searchable == don't index User/SharedWithMe collections
  scope :search_import, -> do
    searchable.includes(
      [
        {
          items: %i[
            tags
          ],
        },
        :tags,
        :users,
      ],
    )
  end

  def self.unsearchable_types
    [
      'Collection::UserCollection',
      'Collection::SharedWithMeCollection',
    ]
  end

  def self.uncollectable_types
    Collection.unsearchable_types +
      [
        'Collection::GlobalCollection',
      ]
  end

  # By default all string fields are searchable
  def search_data
    updated_date = Arel.sql('DATE(updated_at)')
    activity_dates = activities.group(updated_date).pluck(updated_date)
    {
      type: type,
      name: name,
      tags: all_tag_names,
      users: user_list,
      content: search_content,
      organization_id: organization_id,
      user_ids: search_user_ids,
      group_ids: search_group_ids,
      parent_id: parent&.id,
      parent_ids: parent_ids,
      activity_dates: activity_dates.empty? ? nil : activity_dates,
      created_at: created_at,
      updated_at: updated_at,
      archived: archived,
      master_template: master_template,
      collection_type: collection_type,
      activity_count: activities_and_child_activities_count,
    }
  end

  # just for reindexing, you can call:
  # Collection.reindex(:new_search_data) to only reindex those fields (more efficiently)
  def new_search_data
    # for now these are the same
    activity_search_data
  end

  def activity_search_data
    {
      activity_count: activities_and_child_activities_count,
    }
  end

  def all_tag_names
    # We include item tags because you currently can't search for items
    all_tags = (
      tags.map(&:name) +
      items.includes(:tags).map(&:tags).flatten.map(&:name)
    ).map(&:downcase).uniq

    # Remove all dashes, because we use dashes to indicate spaces
    all_tags.map do |tag|
      tag.gsub(/\-+/, ' ')
    end
  end

  def search_content
    # TODO: indexing private sub-content differently?
    # Current functionality for getting a collection's searchable "text content":
    # - go through all items in the collection
    # - for TextItems, grab all their content
    # - for other items (e.g. media), grab the name
    # - join it all together into one blob of text, remove non-normal characters
    items.map do |item|
      if item.is_a? Item::TextItem
        item.plain_content
      else
        item.name
      end
    end.join(' ').gsub(/[^\p{Alnum}\s]/, ' ')
  end
  # <-- End Searchkick

  # default relationships to include when rendering Collections in the API
  def self.default_relationships_for_api
    [
      :created_by,
      :organization,
      :parent_collection_card,
      :parent,
      :submissions_collection,
      :submission_template,
      :template,
      :collection_to_test,
      :live_test_collection,
      :collection_cover_items,
      :test_audiences,
      :restorable_parent,
      :collection_filters,
      :collection_cover_text_items,
      roles: %i[pending_users users groups resource],
    ]
  end

  # similar to above but for AR .includes(...)
  # requires `collection/item` instead of `record`
  def self.default_relationships_for_query
    [
      :created_by,
      :organization,
      :translations,
      parent_collection_card: %i[parent],
      roles: %i[users groups resource],
    ]
  end

  amoeba do
    enable
    # propagate to STI models
    propagate
    nullify :breadcrumb
    nullify :created_by_id
    nullify :organization_id
    nullify :shared_with_organization
    set archived: false
    # don't recognize any relations, easiest way to turn them all off
    recognize []
  end

  def duplicate!(
    for_user: nil,
    copy_parent_card: false,
    parent: self.parent,
    building_template_instance: false,
    system_collection: false,
    synchronous: false,
    batch_id: nil,
    card: nil
  )
    # Clones collection and all embedded items/collections
    c = amoeba_dup
    if c.is_a?(Collection::UserProfile)
      c = c.becomes(Collection)
      c.type = nil
    end
    if parent.master_template?
      # when duplicating into a master_template, this collection should be a subtemplate
      c.template_id = nil
      c.master_template = true
    elsif building_template_instance
      c.template = self
      c.master_template = false
    end
    # clear out cached submission_attrs
    c.cached_attributes.delete 'submission_attrs'
    c.cloned_from = self
    c.created_by = for_user
    c.tag_list = tag_list
    # copy roles from parent (i.e. where it's being placed)
    c.roles_anchor_collection_id = parent.roles_anchor.id

    # copy organization_id from the collection this is being moved into
    # NOTE: parent is only nil in Colab import -- perhaps we should clean up any Colab import specific code?
    c.organization_id = parent.try(:organization_id) || organization_id

    if system_collection && self.parent.try(:parent).try(:getting_started?)
      c.getting_started_shell = true
    end

    # save the dupe collection first so that we can reference it later
    # return if it didn't work for whatever reason
    c.parent_collection_card = card if card
    return c unless c.save

    c.parent_collection_card.save if c.parent_collection_card.present?

    if copy_parent_card && parent_collection_card.present?
      c.parent_collection_card = parent_collection_card.duplicate!(
        for_user: for_user,
        shallow: true,
        parent: parent,
        batch_id: batch_id,
      )
      c.parent_collection_card.collection = c
    end

    # Method from Externalizable
    duplicate_external_records(c)

    c.enable_org_view_access_if_allowed

    collection_filters.each do |cf|
      cf.duplicate!(assign_collection: c)
    end

    if collection_cards.any? && !c.getting_started_shell
      # NOTE: this is the one other place where we call the DuplicationWorker directly,
      # because we don't want to convert links -> placeholders -> primary cards,
      # and we also don't want to remap links again as this is already part of a batch.
      CollectionCardDuplicationWorker.send(
        "perform_#{synchronous ? 'sync' : 'async'}",
        batch_id,
        collection_cards.map(&:id),
        c.id,
        for_user.try(:id),
        system_collection,
        synchronous,
        building_template_instance,
      )
    end

    # pick up newly created relationships
    c.reload
  end

  def copy_all_cards_into!(
    target_collection,
    placement: 'beginning',
    synchronous: false,
    system_collection: false
  )
    cards = collection_cards.select do |card|
      # ensures single copy, if existing copies already exist it will skip those
      existing_records = target_collection.collection_cards.map(&:record)
      existing_records.none? { |record| record.cloned_from == card.record }
    end

    duplicates = CollectionCardDuplicator.call(
      to_collection: target_collection,
      cards: cards,
      placement: placement,
      system_collection: system_collection,
      synchronous: synchronous,
      # important that we disable this so it preserves links
      create_placeholders: false,
    )

    # return the set of created duplicates
    CollectionCard.where(id: duplicates.pluck(:id))
  end

  def self.build_ideas_collection
    collection = new(name: 'Ideas')
    collection.primary_collection_cards.build(
      record: Item::QuestionItem.new(
        question_type: :question_idea,
      ),
    )
    collection
  end

  # NOTE: this refers to the first level of children
  # i.e. things directly in this collection
  def children
    (items + collections)
  end

  def children_and_linked_children
    (items_and_linked_items + collections_and_linked_collections)
  end

  def searchable?
    true
  end

  def read_only?
    false
  end

  def breadcrumb_title
    name
  end

  def submissions_collection
    nil
  end

  def submission_template
    nil
  end

  def collection_to_test
    nil
  end

  def test_audiences
    []
  end

  def resourceable_class
    # Use top-level class since this is an STI model
    Collection
  end

  def recalculate_child_breadcrumbs_async(cards)
    BreadcrumbRecalculationWorker.perform_async(id, cards.pluck(:id))
  end

  # Cards are explicitly passed in when moving them from another collection to this one
  def recalculate_child_breadcrumbs(cards = collection_cards)
    cards.each do |card|
      next unless card.primary?

      if card.item.present?
        # have to reload in order to pick up new parent relationship
        card.item.reload.recalculate_breadcrumb!
      elsif card.collection_id.present?
        # this method will run the async worker if there are >50 children
        card.collection.reload.recalculate_breadcrumb_tree!
      end
    end
  end

  # similar to above but runs more slowly, and will correct any issues (above assumes breadcrumb tree is accurate)
  def recursively_fix_breadcrumbs!(cards = collection_cards)
    cards.each do |card|
      next unless card.primary?

      if card.item.present?
        # have to reload in order to pick up new parent relationship
        card.item.reload.recalculate_breadcrumb!
      elsif card.collection_id.present?
        # this will run recursively rather than using breadcrumb to find all children
        card.collection.reload.recalculate_breadcrumb!
        card.collection.recursively_fix_breadcrumbs!
      end
    end
  end

  def collection_cards_by_page(page: 1, per_page: CollectionCard::DEFAULT_PER_PAGE)
    all_collection_cards.page(page).per(per_page)
  end

  # If a board, it handles pagination differently
  # rows and cols params are arrays of [min, max]
  def collection_cards_by_row_and_col(rows:, cols:)
    table = CollectionCard.arel_table
    all_collection_cards.where(
      table[:row].gteq(rows[0])
      .and(
        table[:row].lteq(rows[1]),
      )
      .and(
        table[:col].gteq(cols[0]),
      )
      .and(
        table[:col].lteq(cols[1]),
      ),
    )
  end

  # convenience method if card order ever gets out of sync
  def reorder_cards!
    CollectionCard.import(
      calculate_reordered_cards,
      validate: false,
      on_duplicate_key_update: %i[order],
    )
  end

  def reorder_cards_by_collection_name!
    CollectionCard.import(
      calculate_reordered_cards(
        joins: :collection,
        order: Arel.sql('LOWER(collections.name) ASC'),
      ),
      validate: false,
      on_duplicate_key_update: %i[order],
    )
  end

  def increment_card_orders_at(order, amount: 1)
    collection_cards
      .where(CollectionCard.arel_table[:order].gteq(order))
      .update_all([
        '"order" = "order" + ?, updated_at = ?',
        amount,
        Time.current,
      ])
  end

  def unarchive_cards!(cards, card_attrs_snapshot)
    cards.each(&:unarchive!)
    if card_attrs_snapshot.present?
      CollectionUpdater.call(
        self,
        card_attrs_snapshot,
        unarchiving: true,
      )
    end
    if board_collection?
      # re-place any unarchived cards to do collision detection on their original position(s)
      top_left_card = CollectionGrid::Calculator.top_left_card(cards)
      CollectionGrid::BoardPlacement.call(
        moving_cards: cards,
        to_collection: self,
        row: top_left_card.row,
        col: top_left_card.col,
      )
      CollectionCard.import(
        cards.to_a,
        validate: false,
        on_duplicate_key_update: %i[row col],
      )
    else
      reorder_cards!
    end

    return unless master_template?

    queue_update_template_instances(
      updated_card_ids: cards.pluck(:id),
      template_update_action: :unarchive,
    )
  end

  def enable_org_view_access_if_allowed
    # If parent is user collection, allow primary group to see it
    # As long as it isn't the 'Getting Started' collection
    return false unless parent&.is_a?(Collection::UserCollection) &&
                        (cloned_from.blank? ||
                         !cloned_from.getting_started? &&
                         !cloned_from.inside_getting_started?)

    # collections created in My Collection always get unanchored
    unanchor_and_inherit_roles_from_anchor!
    organization.primary_group.add_role(Role::VIEWER, self).try(:persisted?)
  end

  def reindex_sync
    Searchkick.callbacks(true) do
      reindex
    end
  end

  # even though this just calls the above method, this gets around the issue
  # where you can't declare `after_commit :reindex_sync` with two different conditions
  def reindex_after_archive
    reindex_sync
  end

  def self.reindex_async(ids)
    ids.each do |collection_id|
      search_index.reindex_queue.push(collection_id)
    end
  end

  def touch_related_cards
    try(:parent_collection_card).try(:touch)
    cards_linked_to_this_collection.update_all(updated_at: updated_at)
  end

  def rename_challenge_groups
    if challenge_admin_group.present?
      challenge_admin_group.update(name: "#{name} Admins")
    end

    if challenge_reviewer_group.present?
      challenge_reviewer_group.update(name: "#{name} Reviewers")
    end

    return unless challenge_participant_group.present?

    challenge_participant_group.update(name: "#{name} Participants")
  end

  def owned_tag_list
    all_tags_list - tag_list
  end

  def cache_tag_list
    self.cached_tag_list = tag_list
  end

  def cache_user_list
    self.cached_user_list = user_list
  end

  def cache_owned_tag_list
    self.cached_owned_tag_list = owned_tag_list
  end

  # these all get called from CollectionUpdater
  def update_cached_tag_lists
    cache_tag_list if tag_list != cached_tag_list
    cache_user_list if user_list != cached_user_list
    cache_owned_tag_list if owned_tag_list != cached_owned_tag_list
  end

  def display_cover?
    # overridden in some STI classes
    true
  end

  def cache_cover
    self.cached_cover = DefaultCollectionCover.call(self)
  end

  def cache_cover!
    cache_cover
    save
  end

  def cache_card_count!
    cache_attributes!(
      cached_card_count: collection_cards.visible.count,
    )
  end

  def activities_and_child_activities_count
    (cached_activity_count || 0) +
      all_child_collections.sum("(collections.cached_attributes->>'cached_activity_count')::INT") +
      all_child_items.sum("(items.cached_attributes->>'cached_activity_count')::INT")
  end

  def update_cover_text!(text_item)
    cached_cover['text'] = DefaultCollectionCover.cover_text(self, text_item)
    save
  end

  def org_templates?
    false
  end

  def profiles?
    false
  end

  def getting_started?
    false
  end

  def destroyable?
    # currently the only destroyable type is an incomplete SubmissionBox
    false
  end

  def cache_key(card_order = 'order', user_id = nil)
    test_details = ''
    challenge_details = ''
    if test_or_test_results_collection?
      # make sure these details factor into caching
      test_details = "launchable=#{launchable?}&can_reopen=#{can_reopen?}"
    end

    if parent_challenge.present?
      challenge_details = "parent_challenge_id=#{parent_challenge.id}"
    end

    %(#{jsonapi_cache_key}
      /#{ActiveRecord::Migrator.current_version}
      /#{ENV['HEROKU_RELEASE_VERSION']}
      /order_#{card_order}
      /cards_#{collection_cards.maximum(:updated_at).to_i}
      /#{test_details}
      /#{challenge_details}
      /gs_#{getting_started_shell}
        /org_#{organization.updated_at}
      /user_id_#{user_id}
      /locale_#{I18n.locale}
      /roles_#{anchored_roles.maximum(:updated_at).to_i}
    ).gsub(/\s+/, '')
  end

  def jsonapi_type_name
    'collections'
  end

  def default_card_order
    if self.class.in? [Collection::SharedWithMeCollection, Collection::SubmissionsCollection]
      # special behavior where it defaults to newest first
      return 'updated_at'
    end

    'order'
  end

  def clear_collection_cover
    cover = primary_collection_cards.where(is_cover: true).first
    return if cover.nil?

    cover.update(is_cover: false)
    touch
  end

  def reset_permissions!
    all_collections = Collection.in_collection(self)
    all_items = Item.in_collection(self)
    [all_collections, all_items].each do |records|
      records.update_all(
        roles_anchor_collection_id: roles_anchor.id,
        updated_at: Time.current,
      )
      records.find_each do |record|
        record.roles.destroy_all if record.roles.present?
      end
    end
  end

  def submit_submission!
    return unless submission?

    cached_inheritance['private'] = false
    # have to unset this before we can call MergeToChild
    submission_attrs['hidden'] = false
    result = save
    Roles::MergeToChild.call(
      parent: parent_submission_box,
      child: self,
    )
    result
  end

  def default_group_id
    return self[:default_group_id] if self[:default_group_id].present? || roles_anchor == self

    roles_anchor&.default_group_id
  end

  # =================================
  # Various boolean queries/checks
  # - many are related to test collections and submission_boxes
  # - could perhaps be moved into a helper module?
  # =================================
  def test_collection?
    is_a?(Collection::TestCollection)
  end

  def test_or_test_results_collection?
    test_collection? || is_a?(Collection::TestResultsCollection)
  end

  def board_collection?
    type == 'Collection::Board'
  end

  def global_collection?
    type == 'Collection::Global'
  end

  def inside_a_master_template?
    master_template? || child_of_a_master_template?
  end

  def child_of_a_master_template?
    parents.where(master_template: true).any?
  end

  def subtemplate?
    master_template? && child_of_a_master_template?
  end

  def subtemplate_instance?
    # is this an instance of a subtemplate
    templated? && template&.subtemplate?
  end

  def inside_a_template_instance?
    return true if templated?

    parents.where.not(template_id: nil).any?
  end

  def parent_submission_box
    parents.where(type: 'Collection::SubmissionBox').last
  end

  def parent_submission
    parents.where("cached_attributes->'submission_attrs'->>'submission' = 'true'").last
  end

  def parent_challenge
    parents.where(collection_type: :challenge).last
  end

  def challenge_or_inside_challenge?
    return true if collection_type == 'challenge'

    parent_challenge.present?
  end

  def inside_getting_started?
    parents.any?(&:getting_started?)
  end

  def parent_submission_box_template
    @parent_submission_box_template ||= begin
      return nil unless inside_a_submission_box?

      template_id = parent_submission_box&.submission_template_id
      return nil unless template_id.present?

      parents.where(id: template_id).first
    end
  end

  def submission_box_template?
    return false unless master_template? && inside_a_submission_box?

    id == parent_submission_box&.submission_template_id
  end

  def inside_a_submission_box_template?
    parent_submission_box_template.present?
  end

  def inside_a_submission_box?
    return true if is_a?(Collection::SubmissionBox)

    parents.where(type: 'Collection::SubmissionBox').any?
  end

  def submission_box_template_test?
    return false unless is_a?(Collection::TestCollection)

    master_template? && inside_a_submission_box_template?
  end

  def inside_hidden_submission_box?
    parent_submission_box&.hide_submissions == true
  end

  def submission?
    submission_attrs.present? && submission_attrs['submission']
  end

  def inside_a_submission?
    parents.where("cached_attributes->'submission_attrs'->>'submission' = 'true'").any?
  end

  def submission_test?
    return unless inside_a_submission?

    parent_submission.submission_attrs['launchable_test_id'] == id
  end

  # check for template instances anywhere in the entire collection tree
  def any_template_instance_children?
    Collection.in_collection(id).where.not(template_id: nil).any?
  end

  def parent_application_collection
    return self if is_a?(Collection::ApplicationCollection)

    parents.where(type: 'Collection::ApplicationCollection').first
  end

  def inside_an_application_collection?
    is_a?(Collection::ApplicationCollection) ||
      parent_application_collection.present?
  end

  def awaiting_updates?
    getting_started_shell || loading_content
  end

  def broadcasting?
    broadcasting.present?
  end

  def inside_a_creative_difference_collection?
    creative_difference_root_collection_id = ENV['CREATIVE_DIFFERENCE_ADMINISTRATION_COLLECTION_ID']

    unless creative_difference_root_collection_id
      logger.debug(
        'Please add "CREATIVE_DIFFERENCE_ADMINISTRATION_COLLECTION_ID" environment variable to your app config.',
      )
    end

    inside_an_application_collection? ||
      within_collection_or_self?(creative_difference_root_collection_id.to_i)
  end

  # =================================
  # <--- end boolean checks
  #

  def serial_collection_cover_items
    # Carousels load their data asynchronously on the front end
    return [] if cover_type_carousel?

    # Only include cover items if this collection has indicated to use them
    cover_type_default? ? [] : collection_cover_items
  end

  # convert placement of 'beginning' or 'end' into an integer order
  def card_order_at(placement)
    return placement if placement.is_a?(Integer)

    # default to 'beginning', which goes after the first pinned card
    if master_template?
      order = 0
    else
      order = collection_cards.pinned.maximum(:order) || 0
    end
    if placement == 'end'
      order = collection_cards.maximum(:order) || -1
      order += 1
    end
    order
  end

  def has_child_collections?
    collections.count.positive?
  end

  def should_pin_cards?(placement)
    return false unless master_template?

    has_pinned_cards = collection_cards.pinned.any?

    return false unless has_pinned_cards

    return true if placement == 'beginning'

    if placement == 'end'
      return collection_cards.unpinned.none?
    end

    first_moving_card_index = collection_cards.find_index { |cc| cc.order == placement }

    return collection_cards.last&.pinned? if first_moving_card_index.nil?

    return true if first_moving_card_index <= 1

    left_of_first_moving_card_index = first_moving_card_index - 1

    collection_cards[left_of_first_moving_card_index].pinned?
  end

  def create_challenge_groups_and_assign_roles
    return if challenge_admin_group.present? && challenge_reviewer_group.present? && challenge_participant_group.present?

    admin_group = create_challenge_admin_group(name: "#{name} Admins", organization: organization)
    reviewer_group = create_challenge_reviewer_group(name: "#{name} Reviewers", organization: organization)
    participant_group = create_challenge_participant_group(name: "#{name} Participants", organization: organization)

    self.challenge_admin_group_id = admin_group.id
    self.challenge_reviewer_group_id = reviewer_group.id
    self.challenge_participant_group_id = participant_group.id

    admin_group.add_role(Role::EDITOR, self)
    reviewer_group.add_role(Role::VIEWER, self)
    participant_group.add_role(Role::VIEWER, self)
  end

  private

  def calculate_reordered_cards(order: { pinned: :desc, order: :asc }, joins: nil)
    cards_to_update = []
    visible_cards = all_collection_cards.visible.active.joins(joins).order(order)
    hidden_cards = all_collection_cards.hidden.active.joins(joins).order(order)
    index = -1
    [visible_cards, hidden_cards].each do |card_set|
      card_set.each do |card|
        index += 1
        next if card.order == index

        card.order = index
        cards_to_update << card
      end
    end
    cards_to_update
  end

  def organization_blank?
    organization.blank?
  end

  def parent_collection_card_blank?
    parent_collection_card.blank?
  end

  def parent_collection
    # this first case should return e.g. when using CollectionCardBuilder
    return parent if parent_collection_card.present?
    # if the collection is in process of being built, parent_collection_card will always be nil
    # (currently mostly useful for specs, when we are creating models directly)
    if (primary = collection_cards.first)
      return primary.parent
    end

    nil
  end

  def inherit_parent_organization_id
    return true if organization.present?
    return true unless parent_collection.present?

    self.organization_id = parent_collection.organization_id
  end

  def pin_all_primary_cards
    primary_collection_cards.update_all(pinned: true)
  end

  def now_master_template?
    saved_change_to_master_template? && master_template?
  end

  def set_joinable_guest_group
    # If anyone can join, default to guest group
    # Otherwise, clear out joinable group
    self.joinable_group_id = anyone_can_join? ? organization.guest_group_id : nil
  end

  def add_viewer_to_joinable_group
    return if joinable_group.blank?

    joinable_group.add_role(Role::VIEWER, self)
  end

  def prevent_template_instance_inside_master_template
    return unless templated? && inside_a_master_template?

    errors.add(:base, "can't be an instance inside a template")
  end

  def will_become_a_challenge?
    will_save_change_to_collection_type? && collection_type_in_database != 'challenge' && collection_type == 'challenge'
  end
end
