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

class Collection
  class TestCollection < Collection
    include AASM

    has_many :survey_responses, dependent: :destroy
    has_many :question_answers, through: :survey_responses
    has_one :test_results_collection,
            -> { master_results },
            inverse_of: :test_collection
    has_many :test_results_idea_collections,
             -> { idea_results },
             class_name: 'TestCollection::TestResultsCollection',
             inverse_of: :test_collection
    has_many :question_items,
             -> { questions },
             source: :item,
             class_name: 'Item::QuestionItem',
             through: :primary_collection_cards
    has_many :test_audiences, dependent: :destroy
    has_many :paid_test_audiences,
             -> { paid },
             class_name: 'TestAudience'

    belongs_to :collection_to_test, class_name: 'Collection', optional: true

    delegate :datasets, to: :test_results_collection, allow_nil: true

    before_create :setup_default_status_and_questions, unless: :cloned_or_templated?
    after_create :add_test_tag
    after_create :add_child_roles
    after_create :setup_link_sharing_test_audience, unless: :collection_to_test
    after_update :touch_test_results_collection, if: :saved_change_to_test_status?
    after_update :update_ideas_collection, if: :saved_change_to_test_show_media?
    after_update :archive_idea_questions, if: :now_in_collection_test_with_default_cards?
    after_commit :close_test_after_archive, if: :archived_on_previous_save?

    FEEDBACK_DESIGN_SUFFIX = ' Feedback Design'.freeze
    MIN_NUM_PAID_QUESTIONS = 10

    enum test_status: {
      draft: 0,
      live: 1,
      closed: 2,
    }

    aasm column: :test_status, enum: true do
      state :draft, initial: true
      state :live
      state :closed

      error_on_all_events :aasm_event_failed

      event :launch,
            guards: [
              :valid_and_launchable?,
              proc { |**args|
                attempt_to_purchase_test_audiences!(
                  user: args[:initiated_by],
                  test_audience_params: args[:test_audience_params],
                )
              },
            ],
            after_commit: proc { |**args|
                            post_launch_setup!(
                              initiated_by: args[:initiated_by],
                            )
                          } do
        transitions from: :draft, to: :live
      end

      event :close,
            after_commit: :after_close_test do
        transitions from: :live, to: :closed
      end

      event :reopen,
            guard: :can_reopen?,
            after_commit: proc { |**args|
                            post_launch_setup!(initiated_by: args[:initiated_by], reopening: true)
                          } do
        transitions from: :closed, to: :live
      end
    end

    amoeba do
      set test_status: :draft
    end

    def self.default_question_types_by_section
      {
        intro: %i[question_category_satisfaction],
        ideas: %i[
          ideas_collection
          question_clarity
          question_excitement
          question_useful
          question_open
        ],
        outro: %i[
          question_open
          question_finish
        ],
      }
    end

    # Used so that we can interchangably call this on TestCollection and TestDesign
    # TODO: check, is this still needed with TestResults?
    def test_collection
      self
    end

    def base_name
      name.sub(FEEDBACK_DESIGN_SUFFIX, '')
    end

    def test_audience_closed!
      # Never close a test or notify, if paid audiences are still open
      return if any_paid_audiences_open?

      # in the case a paid test was running, and the last paid audience closed
      if gives_incentive?
        # notify the editors
        NotifyFeedbackCompletedWorker.perform_async(id)
      end
      # Never close a test that still has link sharing enabled
      return if link_sharing_enabled?

      # Otherwise close the test
      close!
    end

    def still_accepting_answers?
      return true if live?
      return false if test_closed_at.nil?

      closed? && 10.minutes.ago < test_closed_at
    end

    def update_cached_submission_status(related)
      # `related` will be either a submission, or a submission_template
      # we need to track any changes in the cached test_status
      related.submission_attrs ||= {}
      related.submission_attrs['test_status'] = test_status
      related.save
    end

    # This gets called by template update worker when you launch
    def update_submissions_launch_status
      return unless master_template? && live?

      parent_submission_box.submissions_collection.collections.each do |submission|
        update_submission_launch_status(submission)
      end
    end

    def update_submission_launch_status(submission)
      # find the launchable test within this particular submission
      launchable_test = Collection
                        .in_collection(submission)
                        .find_by(template_id: id)
      return unless launchable_test.present?

      submission.update(
        submission_attrs: {
          # this should have already been set but want to preserve the value as true
          submission: true,
          template_test_id: id,
          launchable_test_id: launchable_test.id,
          test_status: launchable_test.test_status,
        },
      )
      # e.g. if we switched which test is running, we want to switch to the latest one
      submission.cache_test_scores!
    end

    def close_all_submissions_tests!
      test_ids = parent_submission_box.submissions_collection.collections.map do |c|
        next unless c.try(:submission_attrs).try(:[], 'test_status') == 'live'

        c.submission_attrs['launchable_test_id']
      end.compact
      # another one that could maybe use a bg worker (if lots of tests)
      # we use the AASM method to ensure that callbacks are carried through
      Collection::TestCollection.where(id: test_ids).find_each(&:close!)
    end

    # various checks for if this test_collection is in a launchable state
    # note that `questions_valid?` is independent from this
    def launchable?
      return false unless draft? || closed?

      # is this in a submission? If so, am I tied to a test template, and is that one launched?
      if inside_a_submission? && !submission_test_launchable?
        errors.add(:base, 'Submission Box admin has not launched the test.')
        return false
      end
      if inside_a_submission_box_template?
        parent_test_status = parent_submission_box_template.submission_attrs.try(:[], 'test_status')
        if parent_test_status == 'live'
          errors.add(:base, 'You already have a running submission box test. Please close that one before proceeding.')
          return false
        end
      end
      # standalone tests otherwise don't really have any restrictions
      return true unless collection_to_test.present?

      # lastly, make sure there is not another live in-collection test for the same collection
      if collection_to_test.live_test_collection.present?
        errors.add(:base, 'You already have another test running on this same collection. Please close that one before proceeding.')
        return false
      end

      true
    end

    def submission_test_launchable?
      # This checks if the parent template has been launched, which indicates that the
      # submission box editors have enabled the related submission tests
      !templated? || template.live?
    end

    def questions_valid?
      return true if inside_a_submission_box_template?

      incomplete_items = incomplete_question_items
      return true if incomplete_items.blank?

      incomplete_items.each do |item|
        errors.add(:base, item.incomplete_description)
      end
      # this lets the frontend/API know that invalid question_items was the failure point
      errors.add(:question_items, 'are invalid')

      false
    end

    def valid_and_launchable?
      questions_valid? && launchable?
    end

    def live_or_was_launched?
      live? || test_launched_at.present?
    end

    def can_reopen?
      closed? && valid_and_launchable?
    end

    def duplicate!(**args)
      duplicate = super(args)

      return duplicate if duplicate.new_record? || args[:parent].blank?

      if collection_to_test.present?
        # Point to the new parent as the one to test
        duplicate.collection_to_test = args[:parent]
      elsif ideas_collection.blank?
        duplicate.primary_collection_cards.build(
          order: -1,
          section_type: :ideas,
          record: Collection.build_ideas_collection,
        )
      end
      if !parent.master_template? && !args[:parent].master_template?
        # Prefix with 'Copy' if it isn't still within a template
        duplicate.name = "Copy of #{name}".gsub(FEEDBACK_DESIGN_SUFFIX, '')
      end
      duplicate.save
      duplicate.reorder_cards!
      duplicate
    end

    def test_open_response_collections
      collections.where(type: 'Collection::TestOpenResponses')
    end

    def ideas_collection
      collections.joins(:primary_collection_cards).merge(
        CollectionCard.ideas_collection_card,
      ).first
    end

    def create_uniq_survey_response(user_id: nil, test_audience_id: nil)
      survey_responses.create(
        session_uid: SecureRandom.uuid,
        user_id: user_id,
        # only include passed in test_audience_id if it is a valid relation
        test_audience_id: test_audience_ids.include?(test_audience_id) ? test_audience_id : nil,
      )
    end

    def survey_response_for_user(user_id)
      SurveyResponse.find_by(
        test_collection_id: id,
        user_id: user_id,
      )
    end

    def test_survey_render_class_mappings
      Firestoreable::JSONAPI_CLASS_MAPPINGS.merge(
        'Collection::TestCollection': SerializableTestCollection,
        FilestackFile: SerializableFilestackFile,
        QuestionChoice: SerializableQuestionChoice,
      )
    end

    def test_survey_render_includes
      {
        question_cards: [
          :parent,
          record: %i[filestack_file question_choices],
        ],
      }
    end

    def serialized_for_test_survey(test_audience_id: nil, current_user: nil)
      renderer = JSONAPI::Serializable::Renderer.new
      renderer.render(
        self,
        # Use Firestoreable mappings which already include "Simple" Serializers
        # This uses a special serializer that defers collection cards to test design
        class: test_survey_render_class_mappings,
        include: test_survey_render_includes,
        expose: {
          test_audience_id: test_audience_id,
          survey_response_for_user: current_user ? survey_response_for_user(current_user.id) : nil,
        },
      )
    end

    def touch_test_results_collection
      test_results_collection.try(:touch)
    end

    def update_ideas_collection
      ideas_collection&.update(test_show_media: test_show_media)
    end

    def aasm_event_failed(event, current_state = '')
      return if errors.present?

      message = "You can't #{event} because the feedback is #{current_state}"
      errors.add(:base, message)
    end

    def setup_default_status_and_questions
      order = -1

      self.class
          .default_question_types_by_section
          .each do |section_type, question_types|
        question_types.each do |question_type|
          # NOTE: this doesn't use CollectionCardBuilder because it's in before_create
          # so just need to make sure logic like pinning cards is set up appropriately
          if question_type == :ideas_collection
            primary_collection_cards.build(
              order: order += 1,
              section_type: section_type,
              pinned: master_template?,
              record: Collection.build_ideas_collection,
            )
          else
            primary_collection_cards.build(
              order: order += 1,
              section_type: section_type,
              pinned: master_template?,
              record: Item::QuestionItem.new(
                question_type: question_type,
              ),
            )
          end
        end
      end
    end

    def setup_link_sharing_test_audience
      # find the link sharing audience
      audience = Audience.find_by(min_price_per_response: 0)
      # e.g. in unit tests, prevent having to load seeds in tests
      if audience.nil? && Rails.env.test?
        audience = Audience.create(name: 'Share via Link', global_default: 1, min_price_per_response: 0)
      end
      return unless audience.present?

      test_audiences.find_or_create_by(
        audience_id: audience.id,
        status: :closed,
      )
    end

    def add_test_tag
      # create the special #test tag
      tag(
        self,
        with: 'feedback',
        on: :tags,
      )
      update_cached_tag_lists
      # no good way around saving a 2nd time after_create
      save
    end

    def add_child_roles
      items.each(&:inherit_roles_anchor_from_parent!)
    end

    def unarchive_cards!(*args)
      super(*args)
      # unarchive snapshot is not perfect, e.g. if you added new cards, may mix old/new cards
      # so we need to ensure that the question_finish is always at the end
      item = items.find_by(question_type: Item::QuestionItem.question_types[:question_finish])
      return unless item.present?

      card = item.parent_collection_card
      card.update_column(:order, 9999)
      reorder_cards!
    end

    def hide_or_show_section_questions!
      hidden = collection_to_test_id.present? ? true : false
      question_cards_from_sections(%i[intro outro])
        .joins(:item)
        .where.not(
          Item.arel_table[:question_type].eq(:question_finish),
        )
        .update_all(
          hidden: hidden,
        )
      primary_collection_cards.ideas_collection_card.update(
        hidden: hidden,
      )
      question_items.question_finish.first&.parent_collection_card&.update(order: 999)
      reorder_cards!
    end

    def ideas_question_items
      question_items_from_sections(%i[ideas])
    end

    def non_repeating_question_items
      question_items_from_sections(%i[intro outro])
    end

    def incomplete_question_items
      incomplete_items = idea_items
                         .joins(:parent_collection_card)
                         .select(&:question_item_incomplete?)

      incomplete_items += question_items
                          .joins(:parent_collection_card)
                          .where(CollectionCard.arel_table[:hidden].eq(false))
                          .select(&:question_item_incomplete?)

      incomplete_items.compact
    end

    def remove_empty_question_items
      incomplete_card_ids = incomplete_question_items.map(&:parent_collection_card).pluck(:id)

      return unless incomplete_card_ids.present?

      queue_update_template_instances(
        updated_card_ids: incomplete_card_ids,
        template_update_action: :archive,
      )
      incomplete_question_items.select do |item|
        item.question_type.blank?
      end.each(&:destroy)
    end

    def idea_items
      return Item.none if ideas_collection.blank? ||
                          ideas_collection.parent_collection_card.hidden?

      ideas_collection.items
                      .joins(:parent_collection_card)
                      .where(CollectionCard.arel_table[:hidden].eq(false))
    end

    def idea_cards
      ideas_collection&.collection_cards&.visible || CollectionCard.none
    end

    def paid_question_items
      TestCollectionCardsForSurvey
        .call(self)
        .reject { |card| card.item&.question_finish? }
    end

    def completed_scale_question_survey_answers
      question_answers
        .joins(:survey_response)
        .joins(:question)
        .where(
          SurveyResponse.arel_table[:status].eq(:completed),
        )
        .merge(
          Item::QuestionItem.scale_questions,
        )
    end

    def score_of_best_idea
      # answers are 1-4, but scored on a scale of 0-3
      # TODO: change the answer_numbers on the emojiScale to go 0-3 to match? (would need to migrate old answers)

      # get the score of the max scoring idea for this question
      points_by_idea =
        completed_scale_question_survey_answers
        .group(:idea_id)
        .sum('answer_number - 1')
        .sort_by { |_idea, points| points }
        .reverse
      return 0 if points_by_idea.empty?

      idea_id, points = points_by_idea.first
      total = completed_scale_question_survey_answers.where(idea_id: idea_id).count * 3
      # don't want to divide by 0
      return 0 if total.zero?

      (points * 100.0 / total).round
    end

    def cloned_or_templated?
      cloned_from.present? || template_id.present?
    end

    def gives_incentive?
      # right now the check is basically any paid tests == gives_incentive
      test_audiences.paid.present?
    end

    def gives_incentive_for?(test_audience_id)
      test_audiences.paid.find_by(id: test_audience_id).present?
    end

    def purchased?
      gives_incentive? && live?
    end

    def link_sharing?
      test_audiences.link_sharing.where(status: :open).present?
    end

    def link_sharing_audience
      test_audiences.link_sharing.first
    end

    def any_paid_audiences_open?
      test_audiences.paid.open.count.positive?
    end

    def link_sharing_enabled?
      link_sharing_audience.present? && link_sharing_audience.open?
    end

    def paid_audiences_sample_size
      test_audiences.paid.sum(:sample_size)
    end

    def question_cards_from_sections(section_names)
      primary_collection_cards.where(
        CollectionCard.arel_table[:section_type].in(section_names),
      )
    end

    # #########################################################################
    # This migrates unlaunched pre-feedback-3.0 test collections to a feedback-3.0
    # style test collection, ready to be launched.
    def migrate!
      # exit if this is already 3.0
      return if ideas_collection.present? ||
                collection_cards.where.not(section_type: nil).any?

      if draft?
        ideas_collection_card = primary_collection_cards.create(
          order: 0,
          section_type: :ideas,
          record: Collection.new(name: 'Ideas'),
        )
        first_media_item = items.where(
          type: ['Item::FileItem', 'Item::LinkItem', 'Item::VideoItem'],
        ).or(
          items.where(
            type: 'Item::QuestionItem',
            question_type: nil,
          ),
        ).first
        first_description_item = items.question_description.first

        if first_media_item.present?
          first_media_item.update(
            question_type: :question_idea,
            content: first_description_item&.content,
          )
          # Move this "idea" to the ideas collection
          first_media_item.parent_collection_card.update(
            parent_id: ideas_collection_card.collection.id,
          )
          first_description_item&.destroy
        elsif first_description_item.present?
          first_description_item.update(
            question_type: :question_idea,
          )
          first_description_item.parent_collection_card.update(
            parent_id: ideas_collection_card.collection.id,
          )
        else
          ideas_collection_card.collection.primary_collection_cards.create(
            record: Item::QuestionItem.new(
              question_type: :question_idea,
            ),
          )
        end
      end

      question_items.where(question_type: nil).update_all(
        question_type: :question_media,
      )
      primary_collection_cards.update_all(
        section_type: :ideas,
        updated_at: Time.current,
      )
      question_finish = items.question_finish.first
      return unless question_finish.present?

      question_finish.parent_collection_card.update(
        section_type: :outro,
      )
    end

    def queue_update_live_test(card_id)
      return unless live?

      ::TestResultsCollection::CreateContentWorker.perform_async(
        test_results_collection.id,
        nil,
        card_id,
      )
    end

    private

    def question_items_from_sections(section_names)
      question_items.joins(:parent_collection_card).where(
        CollectionCard.arel_table[:section_type].in(section_names),
      )
    end

    def attempt_to_purchase_test_audiences!(user:, test_audience_params: nil)
      if test_audience_params.blank?
        # you can launch as long as you have the link sharing option open
        return true if test_audiences.open.any? || collection_to_test.present?

        errors.add(:base, 'Audience required to launch test')
        return false
      end

      # Make sure all prices are up-to-date
      test_audiences.each(&:update_price_per_response_from_audience!)

      purchaser = PurchaseTestAudience.call(
        test_collection: self,
        test_audience_params: test_audience_params,
        user: user,
      )
      return true if purchaser.success?

      errors.add(:base, purchaser.message) if purchaser.message.present?
      false
    end

    def post_launch_setup!(initiated_by: nil, reopening: false)
      if submission_box_template_test?
        parent_submission_box_template.update(
          submission_attrs: {
            template: true,
            launchable_test_id: id,
            test_status: test_status,
          },
        )
        # make sure all templates get the latest question setup
        queue_update_template_instances(
          updated_card_ids: collection_cards.pluck(:id),
          template_update_action: :update_all,
        )
        remove_empty_question_items
        # submission box master template test doesn't create a test_design, move cards, etc.
        return true
      end
      # remove the "blanks"
      remove_empty_question_items
      update_cached_submission_status(parent_submission) if inside_a_submission?
      create_results_collections!(initiated_by) unless reopening
      update(test_launched_at: Time.current, test_closed_at: nil)
      TestCollectionMailer.notify_launch(id).deliver_later if gives_incentive? && ENV['ENABLE_ZENDESK_FOR_TEST_LAUNCH']
    end

    def create_results_collections!(initiated_by = nil)
      result = ::TestResultsCollection::CreateCollection.call(
        test_collection: self,
        created_by: initiated_by || created_by,
      )
      return test_results_collection if result.success?
      p "CREATE RESULTS COLLECTION SUCCESSS" * 100

      errors.add(:base, result.message)
      false
    end

    def after_close_test
      update(test_closed_at: Time.current)

      if inside_a_submission?
        update_cached_submission_status(parent_submission)
      elsif submission_box_template_test?
        update_cached_submission_status(parent_submission_box_template)
        close_all_submissions_tests!
      end
    end

    def close_test_after_archive
      close! if live?
    end

    def now_in_collection_test_with_default_cards?
      saved_change_to_collection_to_test_id? &&
        collection_to_test_id.present? &&
        only_default_cards?
    end

    def only_default_cards?
      card_question_types = collection_cards.map(&:card_question_type)
      card_question_types == self.class.default_question_types_by_section.values.flatten.map(&:to_s)
    end

    def archive_idea_questions
      idea_items.each(&:archive!)
      touch
    end
  end
end
