class Collection
  class TestOpenResponses < Collection
    belongs_to :question_item, class: 'Item::QuestionItem'
  end
end
