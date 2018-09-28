class Collection
  class TestOpenResponses < Collection
    belongs_to :question_item, class_name: 'Item::QuestionItem'
  end
end
