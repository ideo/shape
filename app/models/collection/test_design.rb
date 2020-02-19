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
#  collection_type            :integer          default("collection")
#  cover_type                 :integer          default("cover_type_default")
#  hide_submissions           :boolean          default(FALSE)
#  master_template            :boolean          default(FALSE)
#  name                       :string
#  num_columns                :integer
#  processing_status          :integer
#  search_term                :string
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

########################################################################
# This model is being kept around until we migrate all legacy TestDesigns
# - see #migrate! function below and migrate_old_test_collections rake task
########################################################################

class Collection
  class TestDesign < Collection
    belongs_to :test_collection,
               optional: true,
               class_name: 'Collection::TestCollection'
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

      test_status = tc.test_status

      becomes(Collection::TestCollection).update(
        type: 'Collection::TestCollection',
        test_collection_id: nil,
        collection_to_test_id: to_test_id,
        test_status: nil,
      )
      tc.update(
        type: 'Collection::TestResultsCollection',
        test_collection_id: id,
        collection_to_test_id: nil,
        test_status: nil,
      )

      trc = Collection::TestResultsCollection.find(tc.id)
      test_collection = trc.test_collection
      test_collection.update(test_status: test_status)
      # now migrate itself into the new format
      test_collection.migrate!

      previous_results_card = CollectionCardBuilder.call(
        params: {
          collection_attributes: {
            name: 'Previous Results',
          },
        },
        parent_collection: trc,
      )

      moving_cards = tc.collection_cards.where.not(
        id: [parent_collection_card.id, previous_results_card.id],
      ).to_a
      CardMover.call(
        from_collection: trc,
        to_collection: previous_results_card.collection,
        cards: moving_cards,
      )
      # CardMover will have called everything appropriately, but the
      # card save won't have validated because it wants them to have a section type
      CollectionCard.import(moving_cards, validate: false, on_duplicate_key_update: %i[parent_id])

      [SurveyResponse, TestAudience].each do |klass|
        klass.where(test_collection_id: tc.id).update_all(test_collection_id: id)
      end

      test_collection.reload
      test_collection.survey_responses.each(&:create_alias)

      ::TestResultsCollection::CreateContent.call(
        test_results_collection: trc,
        created_by: created_by,
      )

      previous_results_card.update(order: 999)
      trc.reorder_cards!

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
