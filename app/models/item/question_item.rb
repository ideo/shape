class Item
  class QuestionItem < Item
    has_many :question_answers, inverse_of: :question, foreign_key: :question_id, dependent: :destroy

    enum question_type: {
      context: 0,
      useful: 1,
      open: 2,
      end: 3,
      media: 4,
      description: 5,
      finish: 6,
    }

    def requires_roles?
      # NOTE: QuestionItems defer their can_edit access to their parent collection.
      # this is defined in item.rb as to be shared by Questions / FileItems
      false
    end
  end
end
