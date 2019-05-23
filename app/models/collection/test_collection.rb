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
  class TestCollection < Collection
    include AASM

    has_many :survey_responses, dependent: :destroy
    has_one :test_design, inverse_of: :test_collection
    # this relation exists before the items get moved to the test design
    has_many :prelaunch_question_items,
             -> { questions },
             source: :item,
             class_name: 'Item::QuestionItem',
             through: :primary_collection_cards
    has_many :test_audiences, dependent: :destroy
    belongs_to :collection_to_test, class_name: 'Collection', optional: true

    before_create :setup_default_status_and_questions, unless: :cloned_from_present?
    after_create :add_test_tag, :add_child_roles
    after_update :touch_test_design, if: :saved_change_to_test_status?

    delegate :answerable_complete_question_items, to: :test_design, allow_nil: true

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
              :completed_and_launchable?,
              proc { |**args|
                attempt_to_purchase_test_audiences!(
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

    def self.default_question_types
      %i[
        question_media
        question_description
        question_useful
        question_finish
      ]
    end

    # Used so that we can interchangably call this on TestCollection and TestDesign
    def test_collection
      self
    end

    def attempt_to_purchase_test_audiences!(test_audience_params: nil)
      return true unless test_audience_params.present?
      TestAudiencePurchaser.call(self, test_audience_params)
      return false if errors.present?
      true
    end

    def post_launch_setup!(initiated_by: nil, reopening: false)
      # remove the "blanks"
      remove_incomplete_question_items
      if submission_box_template_test?
        parent_submission_box_template.update(
          submission_attrs: {
            template: true,
            launchable_test_id: id,
            test_status: test_status,
          },
        )
        # make sure all templates get the latest question setup
        queue_update_template_instances
        # submission box master template test doesn't create a test_design, move cards, etc.
        return true
      end
      update_cached_submission_status(parent_submission) if inside_a_submission?
      create_test_design_and_move_cards!(initiated_by: initiated_by) unless reopening
      update(test_launched_at: Time.current, test_closed_at: nil)
      TestCollectionMailer.notify_launch(id).deliver_later if gives_incentive? && ENV['ENABLE_ZENDESK_FOR_TEST_LAUNCH']
    end

    def still_accepting_answers?
      return true if live?
      return false if test_closed_at.nil?
      closed? && 10.minutes.ago < test_closed_at
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

    def update_cached_submission_status(related)
      # `related` will be either a submission, or a submission_template
      # we need to track any changes in the cached test_status
      related.submission_attrs ||= {}
      related.submission_attrs['test_status'] = test_status
      related.save
    end

    # This gets called by template update worker when you launch
    def update_submissions_launch_status
      return unless master_template?
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
      if launchable_test.is_a?(Collection::TestDesign)
        launchable_test = launchable_test.test_collection
      end
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
      Collection::TestCollection.where(id: test_ids).each(&:close!)
    end

    # various checks for if this test_collection is in a launchable state
    # note that `test_completed?` is independent from this
    def launchable?
      return false unless draft? || closed?
      # is this in a submission? If so, am I tied to a test template, and is that one launched?
      if inside_a_submission?
        return false unless submission_test_launchable?
      end
      if inside_a_submission_box_template?
        return false if parent_submission_box_template.try(:submission_attrs).try(:[], 'test_status') == 'live'
      end
      # standalone tests otherwise don't really have any restrictions
      return true unless collection_to_test_id.present?
      # lastly -- make sure there is not another live in-collection test for the same collection
      collection_to_test.live_test_collection.blank?
    end

    def submission_test_launchable?
      # This checks if the parent template has been launched, which indicates that the
      # submission box editors have enabled the related submission tests
      test_template = nil
      if templated?
        test_template = template
      elsif test_design.present? && test_design.templated?
        # the template relation gets moved to the test_design after launch, e.g. for 'reopen'
        test_template = test_design.template
      end
      test_template ? test_template.live? : true
    end

    def test_completed?
      complete = true
      unless incomplete_media_items.count.zero?
        errors.add(:base,
                   'Please add an image or video for your idea to question ' +
                   incomplete_media_items.map { |i| i.parent_collection_card.order + 1 }.to_sentence)
        complete = false
      end

      unless incomplete_description_items.count.zero?
        errors.add(:base,
                   'Please add your idea description to question ' +
                   incomplete_description_items.map { |i| i.parent_collection_card.order + 1 }.to_sentence)
        complete = false
      end

      unless incomplete_category_satisfaction_items.count.zero?
        errors.add(:base,
                   'Please add your category to question ' +
                   incomplete_category_satisfaction_items.map { |i| i.parent_collection_card.order + 1 }.to_sentence)
        complete = false
      end
      complete
    end

    def completed_and_launchable?
      test_completed? && launchable?
    end

    def live_or_was_launched?
      live? || test_launched_at.present?
    end

    def can_reopen?
      return false unless launchable? && test_completed?
      test_design.present? || submission_box_template_test?
    end

    def duplicate!(**args)
      # Only copy over test questions in pre-launch state
      if test_design.present?
        # If test design has already been created, just dupe that
        duplicate = test_design.duplicate!(args)
      else
        # Otherwise dupe this collection
        duplicate = super(args)
      end

      return duplicate if duplicate.new_record? || args[:parent].blank?

      duplicate.type = 'Collection::TestCollection'
      duplicate = duplicate.becomes(Collection::TestCollection)
      if collection_to_test.present?
        # Point to the new parent as the one to test
        duplicate.collection_to_test = args[:parent]
      elsif !parent.master_template? && !args[:parent].master_template?
        # Prefix with 'Copy' if it isn't still within a template
        duplicate.name = "Copy of #{name}"
      end
      duplicate.save
      duplicate
    end

    # alias method, will delegate to test_design if available
    def question_items
      if test_design.present?
        return test_design.question_items
      end
      prelaunch_question_items
    end

    def test_open_response_collections
      collections.where(type: 'Collection::TestOpenResponses')
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
        'Collection::TestDesign': SerializableSimpleCollection,
        FilestackFile: SerializableFilestackFile,
      )
    end

    def test_survey_render_includes
      {
        question_cards: [
          :parent,
          record: [:filestack_file],
        ],
      }
    end

    def serialized_for_test_survey
      renderer = JSONAPI::Serializable::Renderer.new
      renderer.render(
        self,
        # Use Firestoreable mappings which already include "Simple" Serializers
        # This uses a special serializer that defers collection cards to test design
        class: test_survey_render_class_mappings,
        include: test_survey_render_includes,
      )
    end

    def touch_test_design
      test_design.try(:touch)
    end

    def aasm_event_failed(event, current_state = '')
      return if errors.present?
      message = "You can't #{event} because the feedback is #{current_state}"
      errors.add(:base, message)
    end

    def create_test_design_and_move_cards!(initiated_by:)
      test_design_card_builder = build_test_design_collection_card(initiated_by)
      transaction do
        return false unless test_design_card_builder.create
        self.test_design = test_design_card_builder.collection_card.record
        self.template_id = nil # Moves association to the TestDesign
        # move all the cards into the test design collection
        collection_cards
          .where.not(
            id: test_design_card_builder.collection_card.id,
          )
          .each_with_index do |card, i|
            card.update(parent_id: test_design.id, order: i)
          end
        create_open_response_collections(initiated_by: initiated_by)
        create_response_graphs(initiated_by: initiated_by)
        create_media_item_link
        test_design.cache_cover!
      end
      reorder_cards!
      true
    end

    def build_test_design_collection_card(initiated_by)
      # build the TestDesign collection and its card
      card_params = {
        # push it to the end, will get resorted after creation is complete
        order: 999,
        collection_attributes: {
          name: "#{name} Feedback Design",
          type: 'Collection::TestDesign',
          test_collection_id: id,
          template_id: template_id,
        },
      }
      CollectionCardBuilder.new(
        params: card_params,
        parent_collection: self,
        user: initiated_by,
      )
    end

    def create_open_response_collections(open_question_items: nil, initiated_by: nil)
      open_question_items ||= question_items.question_open
      open_question_items.map do |open_question|
        open_question.create_open_response_collection(
          parent_collection: self,
          initiated_by: initiated_by,
        )
      end
    end

    def create_response_graphs(initiated_by:)
      question_items
        .select(&:scale_question?)
        .map do |question|
        question.create_response_graph(
          parent_collection: self,
          initiated_by: initiated_by,
        )
      end
    end

    def create_media_item_link(media_question_items: nil)
      media_question_items ||= test_design.items.reject { |i| i.type == 'Item::QuestionItem' }
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

    def setup_default_status_and_questions
      self.class
          .default_question_types
          .each_with_index do |question_type, i|
        primary_collection_cards.build(
          order: i,
          item_attributes: {
            type: 'Item::QuestionItem',
            question_type: question_type,
          },
        )
      end
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

    # Return array of incomplete media items, with index of item
    def incomplete_media_items
      question_items.joins(
        :parent_collection_card,
      ).where(question_type: :question_media)
    end

    def incomplete_description_items
      question_items
        .joins(
          :parent_collection_card,
        ).where(question_type: :question_description, content: [nil, ''])
    end

    def incomplete_category_satisfaction_items
      question_items
        .joins(
          :parent_collection_card,
        ).where(question_type: :question_category_satisfaction, content: [nil, ''])
    end

    # Returns the question cards that are in the blank default state
    def incomplete_question_items
      question_items
        .joins(
          :parent_collection_card,
        ).where(question_type: nil, filestack_file_id: nil, url: nil)
    end

    def remove_incomplete_question_items
      incomplete_question_items.destroy_all
    end

    def cloned_from_present?
      cloned_from.present?
    end

    def gives_incentive?
      # right now the check is basically any paid tests == gives_incentive
      test_audiences.where('price_per_response > 0').present?
    end

    def link_sharing_audience
      test_audiences.where(price_per_response: 0).first
    end

    def link_sharing_enabled?
      link_sharing_audience.present?
    end
  end
end
