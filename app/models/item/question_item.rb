class Item
  class QuestionItem < Item
    has_many :question_answers, inverse_of: :question

    enum question_type: {
      context: 0,
      useful: 1,
      open: 2,
      end: 3,
      blank_media: 4,
    }
  end
end
