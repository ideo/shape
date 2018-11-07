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
    belongs_to :collection_to_test, class_name: 'Collection', optional: true

    before_create :setup_default_status_and_questions, unless: :cloned_from_present?
    after_create :add_test_tag
    after_update :touch_test_design, if: :saved_change_to_test_status?

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
            guard: :completed_and_launchable?,
            after_commit: proc { |**args|
                            launch_test!(initiated_by: args[:initiated_by])
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
                            launch_test!(initiated_by: args[:initiated_by], reopening: true)
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

    def launch_test!(initiated_by: nil, reopening: false)
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
        update_submissions_launch_status
        # submission box master template test doesn't create a test_design, move cards, etc.
        return true
      end
      update_cached_submission_status(parent_submission) if inside_a_submission?
      # TODO: Perhaps need to do *some* of this setup when reopening?
      create_test_design_and_move_cards!(initiated_by: initiated_by) unless reopening
    end

    def after_close_test
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

    def update_submissions_launch_status
      return unless master_template?
      # TODO: Probably should move to a worker, e.g. if hundreds or thousands of submissions
      parent_submission_box.submissions_collection.collections.each do |submission|
        # find the launchable test within this particular submission
        launchable_test = Collection
                          .in_collection(submission)
                          .find_by(template_id: id)
        next unless launchable_test.present?
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
    end

    def close_all_submissions_tests!
      test_ids = parent_submission_box.submissions_collection.collections.map do |c|
        next unless c.submission_attrs['test_status'] == 'live'
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

    def create_uniq_survey_response(user_id: nil)
      survey_responses.create(
        session_uid: SecureRandom.uuid,
        user_id: user_id,
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

    def create_open_response_collection_cards(open_question_items: nil, initiated_by: nil)
      build_open_response_collection_cards(
        open_question_items: open_question_items,
        initiated_by: initiated_by,
      ).all?(&:create)
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
        create_open_response_collection_cards
        setup_response_graphs(initiated_by: initiated_by).each(&:create)
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

    def build_open_response_collection_cards(open_question_items: nil, initiated_by: nil)
      open_question_items ||= question_items.question_open
      open_question_items.map do |open_question|
        CollectionCardBuilder.new(
          params: {
            order: open_question.parent_collection_card.order,
            collection_attributes: {
              name: "#{open_question.content} Responses",
              type: 'Collection::TestOpenResponses',
              question_item_id: open_question.id,
            },
          },
          parent_collection: self,
          user: initiated_by,
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

    def setup_response_graphs(initiated_by:)
      question_items.map do |question|
        next unless question.scale_question?
        CollectionCardBuilder.new(
          params: {
            order: question.parent_collection_card.order,
            height: 2,
            width: 2,
            item_attributes: {
              type: 'Item::ChartItem',
              data_source: question,
            },
          },
          parent_collection: self,
          user: initiated_by,
        )
      end.compact
    end

    def add_test_tag
      # create the special #test tag
      tag(
        self,
        with: 'test',
        on: :tags,
      )
      update_cached_tag_lists
      # no good way around saving a 2nd time after_create
      save
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
  end
end
