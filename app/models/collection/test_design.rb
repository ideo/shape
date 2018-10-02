class Collection
  class TestDesign < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
    delegate :test_status, to: :test_collection

    has_many :question_items,
             -> { questions },
             source: :item,
             class_name: 'Item::QuestionItem',
             through: :primary_collection_cards

    def question_item_created(question_item)
      return unless question_item.question_open?
      # Create open response collection for this new question item
      test_collection.create_open_response_collection_cards([question_item])
    end
  end
end
