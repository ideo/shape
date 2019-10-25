# == Schema Information
#
# Table name: collections
#
#  id                         :bigint(8)        not null, primary key
#  anyone_can_join            :boolean          default(FALSE)
#  anyone_can_view            :boolean          default(FALSE)
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  cached_test_scores         :jsonb
#  cover_type                 :integer          default("cover_type_default")
#  hide_submissions           :boolean          default(FALSE)
#  master_template            :boolean          default(FALSE)
#  name                       :string
#  processing_status          :integer
#  shared_with_organization   :boolean          default(FALSE)
#  submission_box_type        :integer
#  submissions_enabled        :boolean          default(TRUE)
#  test_closed_at             :datetime
#  test_launched_at           :datetime
#  test_status                :integer
#  type                       :string
#  unarchived_at              :datetime
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  cloned_from_id             :bigint(8)
#  collection_to_test_id      :bigint(8)
#  created_by_id              :integer
#  default_group_id           :integer
#  joinable_group_id          :bigint(8)
#  organization_id            :bigint(8)
#  question_item_id           :integer
#  roles_anchor_collection_id :bigint(8)
#  submission_box_id          :bigint(8)
#  submission_template_id     :integer
#  template_id                :integer
#  test_collection_id         :bigint(8)
#
# Indexes
#
#  index_collections_on_breadcrumb                  (breadcrumb) USING gin
#  index_collections_on_cached_test_scores          (cached_test_scores) USING gin
#  index_collections_on_cloned_from_id              (cloned_from_id)
#  index_collections_on_created_at                  (created_at)
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

class Collection
  class TestResultsCollection < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
    has_many :datasets,
             through: :data_items

    delegate :can_reopen?,
             :launchable?,
             :live_or_was_launched?,
             :gives_incentive?,
             :test_status,
             :collection_to_test,
             :collection_to_test_id,
             :purchased?,
             :link_sharing?,
             :test_audiences,
             :question_items,
             to: :test_collection

    # TODO: revisit what should happen when you archive results or the test
    # after_commit :close_test, if: :archived_on_previous_save?
    # has_many :question_items,
    #          -> { questions },
    #          source: :item,
    #          class_name: 'Item::QuestionItem',
    #          through: :primary_collection_cards

    def duplicate!(**args)
      # TODO: double check is the right thing to do here...
      test_collection.duplicate!(args)
    end

    def initialize_cards!
      transaction do
        create_open_response_collections(initiated_by: created_by)
        create_response_graphs(initiated_by: created_by)
        create_media_item_link
        # might not need this next step?
        test_collection.cache_cover!
      end
      reorder_cards!
      move_legend_item_to_third_spot
      true
    end

    def legend_item
      items.legend_items.first
    end

    def create_open_response_collections(open_question_items: nil, initiated_by: nil)
      open_question_items ||= question_items.question_open
      open_question_items.map do |open_question|
        open_question.find_or_create_open_response_collection(
          parent_collection: self,
          initiated_by: initiated_by,
        )
      end
    end

    def create_response_graphs(initiated_by:)
      legend = nil
      graphs = []
      question_items
        .select(&:scale_question?)
        .each_with_index do |question, i|
        data_item_card = question.find_or_create_response_graph(
          parent_collection: self,
          initiated_by: initiated_by,
          legend_item: legend,
        )
        legend = data_item_card.item.legend_item if i.zero?
        graphs << data_item_card
        test_audiences.each do |test_audience|
          data_item = data_item_card.item
          question.create_test_audience_dataset(test_audience, data_item)
        end
      end

      graphs
    end

    def create_media_item_link(media_question_items: nil)
      media_question_items ||= test_collection.items.reject { |i| i.type == 'Item::QuestionItem' }
      # since we're placing things at the front one by one, we reverse the order
      media_question_items.reverse.map do |media_item|
        next unless media_item.cards_linked_to_this_item.empty?

        CollectionCard::Link.create(
          parent: self,
          item_id: media_item.id,
          width: 1,
          height: 2,
          order: -1,
        )
      end
    end

    private

    def close_test
      test_collection.close! if test_collection.live?
    end

    def move_legend_item_to_third_spot
      return unless legend_item.present?

      legend_card = legend_item.parent_collection_card
      legend_card.move_to_order(2)
    end
  end
end
