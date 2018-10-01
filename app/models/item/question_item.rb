class Item
  class QuestionItem < Item
    has_many :question_answers, inverse_of: :question, foreign_key: :question_id, dependent: :destroy
    has_one :test_open_responses_collection, class_name: 'Collection::TestOpenResponses'

    after_update :update_test_open_responses_collection, if: :update_test_open_responses_collection?

    enum question_type: {
      question_context: 0,
      question_useful: 1,
      question_open: 2,
      question_end: 3,
      question_media: 4,
      question_description: 5,
      question_finish: 6,
    }

    def requires_roles?
      # NOTE: QuestionItems defer their can_edit access to their parent collection.
      # this is defined in item.rb as to be shared by Questions / FileItems
      false
    end

    private

    def update_test_open_responses_collection?
      saved_change_to_name? && test_open_responses_collection.present?
    end

    def update_test_open_responses_collection
      test_open_responses_collection.update(
        name: name,
      )
    end
  end
end
