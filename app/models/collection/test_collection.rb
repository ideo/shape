class Collection
  class TestCollection < Collection
    has_many :survey_responses, dependent: :destroy
    has_many :question_items,
             -> { questions },
             source: :item,
             through: :primary_collection_cards

    before_create :setup_default_status_and_questions
    after_create :add_test_tag

    enum test_status: {
      draft: 0,
      live: 1,
      closed: 2,
    }

    def test_design
      # NOTE: there should only ever be one of these per TestCollection
      collections.where(type: 'Collection::TestDesign').first
    end

    def create_uniq_survey_response
      survey_responses.create(
        session_uid: SecureRandom.uuid,
      )
    end

    def launch_test!(initiated_by:)
      unless draft?
        errors.add(:test_status, 'must be in draft mode in order to launch')
        return false
      end
      # build the TestDesign collection and its card
      card_params = {
        order: 0,
        collection_attributes: {
          name: "#{name} Test Design",
          type: 'Collection::TestDesign',
        }
      }
      builder = CollectionCardBuilder.new(
        params: card_params,
        parent_collection: self,
        user: initiated_by,
      )
      if builder.create
        test_design = builder.collection_card.record
        # move all the cards into the test design collection
        collection_cards.where.not(id: builder.collection_card.id).each_with_index do |card, i|
          card.update(parent_id: test_design.id, order: i)
        end
        test_design.cache_cover!
        update(test_status: :live)
      else
        # errors?
        false
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

    private

    def setup_default_status_and_questions
      # ||= mostly useful for unit tests, otherwise should be nil
      self.test_status ||= :draft
      primary_collection_cards.build(
        order: 0,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :media,
        },
      )
      primary_collection_cards.build(
        order: 1,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :description,
        },
      )
      primary_collection_cards.build(
        order: 2,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :useful,
        },
      )
      primary_collection_cards.build(
        order: 3,
        item_attributes: {
          type: 'Item::QuestionItem',
          question_type: :finish,
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
