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

########################################################################
# This model is being kept around until we migrate all legacy TestDesigns
# - see #migrate! function below and migrate_old_test_collections rake task
########################################################################

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

    def base_name
      name
    end

    ###########
    def migrate!
      tc = Collection.find(test_collection_id)
      # error case
      return if tc.blank?

      to_test_id = tc.collection_to_test_id
      becomes(Collection::TestCollection).update(
        type: 'Collection::TestCollection',
        test_collection_id: nil,
        collection_to_test_id: to_test_id,
      )
      tc.update(
        type: 'Collection::TestResultsCollection',
        test_collection_id: id,
        collection_to_test_id: nil,
      )

      [SurveyResponse, TestAudience].each do |klass|
        klass.where(test_collection_id: tc.id).update_all(test_collection_id: id)
      end

      # these used to have question_type: nil
      items.where.not(type: 'Item::QuestionItem').update_all(question_type: :question_media)

      return unless inside_a_submission?

      Collection
        .where("cached_attributes->'submission_attrs'->>'launchable_test_id' = '#{tc.id}'")
        .find_each do |submission|
          submission.submission_attrs['launchable_test_id'] = id
          submission.save
        end
    end
    ###########
  end
end
