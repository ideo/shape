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

    before_create :setup_default_status_and_questions
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

      event :launch, before: proc { |**args|
                               return false unless test_completed?
                               remove_incomplete_question_items
                               create_test_design_and_move_cards!(initiated_by: args[:initiated_by])
                             } do
        transitions from: :draft, to: :live
      end

      event :close do
        transitions from: :live, to: :closed
      end

      event :reopen do
        transitions from: :closed, to: :live, guard: :test_completed?
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

    # alias method, will delegate to test_design if test is live
    def question_items
      if test_design.present?
        return test_design.question_items
      end
      prelaunch_question_items
    end

    def can_reopen?
      closed? && test_design.present?
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
      complete
    end

    def survey_response_for_user(user_id)
      SurveyResponse.find_by(
        test_collection_id: id,
        user_id: user_id,
      )
    end

    def test_survey_render_class
      Firestoreable::JSONAPI_CLASS_MAPPINGS.merge(
        'Collection::TestCollection': SerializableTestCollection,
        'Collection::TestDesign': SerializableSimpleCollection,
        FilestackFile: SerializableFilestackFile,
      )
    end

    def test_survey_render_includes
      {
        collection_cards: [
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
        class: test_survey_render_class,
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
      true
    end

    def build_test_design_collection_card(initiated_by)
      # build the TestDesign collection and its card
      card_params = {
        order: 0,
        collection_attributes: {
          name: "#{name} Feedback Design",
          type: 'Collection::TestDesign',
          test_collection_id: id,
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
        card_params = {
          order: 0,
          collection_attributes: {
            name: "#{open_question.content} Responses",
            type: 'Collection::TestOpenResponses',
            question_item_id: open_question.id,
          },
        }
        CollectionCardBuilder.new(
          params: card_params,
          parent_collection: self,
          user: initiated_by,
        )
      end
    end

    def setup_default_status_and_questions
      # ||= mostly useful for unit tests, otherwise should be nil
      self.test_status ||= :draft
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
      chart_card_builders = []
      question_items.each_with_index do |question, i|
        next unless question.scale_question?
        chart_card_builders.push(
          CollectionCardBuilder.new(
            params: {
              order: i + 2,
              height: 2,
              width: 2,
              item_attributes: {
                type: 'Item::ChartItem',
                data_source: question,
              },
            },
            parent_collection: self,
            user: initiated_by,
          ),
        )
      end
      chart_card_builders
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
  end
end
