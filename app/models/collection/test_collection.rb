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
          create_test_design_and_move_cards!(initiated_by: args[:initiated_by])
        } do
        transitions from: :draft, to: :live
      end

      event :close do
        transitions from: :live, to: :closed
      end

      event :reopen do
        transitions from: :closed, to: :live
      end
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

    def create_uniq_survey_response
      survey_responses.create(
        session_uid: SecureRandom.uuid,
      )
    end

    def serialized_for_test_survey
      renderer = JSONAPI::Serializable::Renderer.new
      renderer.render(
        self,
        # Use Firestoreable mappings which already include "Simple" Serializers
        class: Firestoreable::JSONAPI_CLASS_MAPPINGS.merge(
          'Collection::TestCollection': SerializableTestCollection,
          'Collection::TestDesign': SerializableSimpleCollection,
          FilestackFile: SerializableFilestackFile,
        ),
        include: {
          collection_cards: [
            :parent,
            record: [:filestack_file],
          ],
        },
      )
    end

    def create_open_response_collection_cards(open_question_items = nil)
      build_open_response_collection_cards(open_question_items).all?(&:create)
    end

    private

    def touch_test_design
      test_design.touch
    end

    def aasm_event_failed(*args)
      errors.add(:test_status, args[0].to_s.downcase)
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

    def build_open_response_collection_cards(open_question_items = nil)
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
          user: created_by,
        )
      end
    end

    def setup_default_status_and_questions
      # ||= mostly useful for unit tests, otherwise should be nil
      self.test_status ||= :draft
      primary_collection_cards.build(
        order: 0,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :question_media,
        },
      )
      primary_collection_cards.build(
        order: 1,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :question_description,
        },
      )
      primary_collection_cards.build(
        order: 2,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :question_useful,
        },
      )
      primary_collection_cards.build(
        order: 3,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :question_finish,
        },
      )
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
  end
end
