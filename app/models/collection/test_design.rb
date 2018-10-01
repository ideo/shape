class Collection
  class TestDesign < Collection
    belongs_to :test_collection, class_name: 'Collection::TestCollection'
    delegate :test_status, to: :test_collection

    has_many :question_items,
             -> { questions },
             source: :item,
             class_name: 'Item::QuestionItem',
             through: :primary_collection_cards
  end
end
