class Collection
  class TestDesign < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
    delegate :test_status, to: :test_collection

    has_many :question_items,
             -> { questions },
             source: :item,
             class_name: 'Item::QuestionItem',
             through: :primary_collection_cards

    after_commit :create_open_response_collection_cards, on: :create

    def question_item_created(question_item)
      return unless question_item.question_open?
      # Create open response collection for this new question item
      create_open_response_collection_cards([question_item])
    end

    private

    def create_open_response_collection_cards(open_question_items = nil)
      build_open_response_collection_cards(open_question_items).all?(&:create)
    end

    def build_open_response_collection_cards(open_question_items = nil)
      open_question_items ||= question_items.question_open
      open_question_items.map do |open_question|
        card_params = {
          order: 0,
          collection_attributes: {
            name: "#{open_question.name} Responses",
            type: 'Collection::TestOpenResponses',
            question_item_id: open_question.id,
          },
        }
        CollectionCardBuilder.new(
          params: card_params,
          parent_collection: test_collection,
          user: created_by,
        )
      end
    end
  end
end
