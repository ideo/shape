class Collection
  class TestCollection < Collection
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

    enum test_status: {
      draft: 0,
      live: 1,
      closed: 2,
    }

    # alias method, will delegate to test_design if test is live
    def question_items
      if test_design.present?
        return test_design.question_items
      end
      prelaunch_question_items
    end

    def test_open_response_collections
      collections.where(type: 'Collection::TestOpenResponses')
    end

    def create_uniq_survey_response
      survey_responses.create(
        session_uid: SecureRandom.uuid,
      )
    end

    def test_completed?
      complete = true
      unless incomplete_media.count.zero?
        errors.add(:base,
                   "Please add an image or video for your idea to question #{incomplete_media.join(', ')}")
        complete = false
      end

      unless incomplete_descriptions.count.zero?
        errors.add(:base,
                   "Please add your idea description to question #{incomplete_descriptions.join(', ')}")
        complete = false
      end
      complete
    end

    def launch_test!(initiated_by:)
      unless draft?
        errors.add(:test_status, 'must be in draft mode in order to launch')
        return false
      end
      unless test_completed?
        return false
      end
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
        update(test_status: :live)
      end
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

    def build_test_design_collection_card(initiated_by)
      # build the TestDesign collection and its card
      card_params = {
        order: 0,
        collection_attributes: {
          name: "#{name} Test Design",
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

    # Return array of incomplete media items, with index of item
    def incomplete_media
      media_items = prelaunch_question_items.select(&:question_media?)
      media_not_present = []
      # TODO: cleanup logic here.
      media_items.each do |item|
        if item.filestack_file.nil? && item.url.nil?
          if item.filestack_file.nil?
            media_not_present.push(item.parent_collection_card.order + 1)
            next
          end
          media_not_present.push(item.parent_collection_card.order + 1) if item.url.nil?
        end
      end
      media_not_present
    end

    def incomplete_descriptions
      description_items = prelaunch_question_items.select(&:question_description?)
      description_not_present = []
      description_items.each do |item|
        description_not_present.push(item.parent_collection_card.order + 1) if item.content.nil?
      end
      description_not_present
    end
  end
end
