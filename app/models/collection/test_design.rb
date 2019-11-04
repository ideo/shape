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
#  index_collections_on_archive_batch               (archive_batch)
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
  class TestDesign < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
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
             to: :test_collection

    after_commit :close_test, if: :archived_on_previous_save?

    has_many :question_items,
             -> { questions },
             source: :item,
             class_name: 'Item::QuestionItem',
             through: :primary_collection_cards

    has_many :survey_responses, through: :test_collection

    COLLECTION_SUFFIX = ' Feedback Design'.freeze

    def self.generate_name(name)
      "#{name}#{COLLECTION_SUFFIX}"
    end

    def duplicate!(**args)
      duplicate = super(args)
      return duplicate unless duplicate.persisted?

      duplicate = duplicate.becomes(Collection::TestCollection)
      duplicate.update(
        test_collection_id: nil,
        type: 'Collection::TestCollection',
        # Don't set this to be a master template if the parent is a template
        master_template: parent.master_template? ? false : master_template,
      )
      # Had to reload otherwise AASM gets into weird state
      duplicate.reload
    end

    def question_item_created(question_item)
      if question_item.question_open?
        # Create open response collection for this new question item
        test_collection.create_open_response_collections(
          open_question_items: [question_item],
        )
      elsif question_item.question_media?
        test_collection.create_media_item_link(
          media_question_items: [question_item],
        )
      end
    end

    def answerable_complete_question_items
      complete_question_items(answerable_only: true)
    end

    def complete_question_items(answerable_only: false)
      # This is for the purpose of finding all completed items to display in the survey
      # i.e. omitting any unfinished/blanks
      questions = answerable_only ? question_items.answerable : items
      questions.reject do |i|
        i.is_a?(Item::QuestionItem) && i.question_type.blank? ||
          i.question_type == 'question_open' && i.content.blank? ||
          i.question_type == 'question_category_satisfaction' && i.content.blank? ||
          i.question_type == 'question_media'
      end
    end

    def complete_question_cards
      complete_question_items.collect(&:parent_collection_card)
    end

    private

    def close_test
      test_collection.close! if test_collection.live?
    end
  end
end
