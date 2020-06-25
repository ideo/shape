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
#  custom_icon                    :string
#  end_date                       :datetime
#  hide_submissions               :boolean          default(FALSE)
#  master_template                :boolean          default(FALSE)
#  name                           :string
#  num_columns                    :integer
#  processing_status              :integer
#  search_term                    :string
#  shared_with_organization       :boolean          default(FALSE)
#  show_icon_on_cover             :boolean
#  start_date                     :datetime
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

class Collection
  class TestResultsCollection < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
    belongs_to :idea,
               class_name: 'Item',
               inverse_of: :test_results_collection,
               optional: true
    belongs_to :survey_response,
               optional: true,
               inverse_of: :test_results_collection

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
             :ideas_collection,
             :idea_items,
             :test_show_media?,
             to: :test_collection,
             allow_nil: true

    scope :master_results, -> { where(idea_id: nil, survey_response_id: nil) }
    scope :idea_results, -> { where.not(idea_id: nil) }

    # TODO: revisit what should happen when you archive results or the test
    # after_commit :close_test, if: :archived_on_previous_save?

    def duplicate!(**args)
      # TODO: double check is the right thing to do here...
      test_collection.duplicate!(args)
    end

    def legend_item
      items.legend_items.first
    end

    def search_data
      opts = super
      return opts if survey_response.nil?

      # Index all the answers this person has chosen,
      # so we can surface this collection in global search
      opts[:test_answer] = ::TestCollection::ResponseSearchKeys.call(survey_response: survey_response)
      opts
    end

    private

    def close_test
      test_collection.close! if test_collection.live?
    end
  end
end
