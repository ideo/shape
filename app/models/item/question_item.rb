class Item
  class QuestionItem < Item
    has_many :question_answers, inverse_of: :question

    enum question_type: {
      context: 0,
      useful: 1,
      open: 2,
      end: 3,
      media: 4,
      description: 5,
    }
  end
end
