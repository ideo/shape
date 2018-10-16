class Item
  class QuestionItem < Item
    has_many :question_answers, inverse_of: :question, foreign_key: :question_id, dependent: :destroy
    has_one :test_open_responses_collection, class_name: 'Collection::TestOpenResponses'

    after_commit :notify_test_design_of_creation,
                 on: :create,
                 if: :notify_test_design_collection_of_creation?

    after_update :update_test_open_responses_collection,
                 if: :update_test_open_responses_collection?

    scope :answerable, -> {
      where.not(
        question_type: Item::QuestionItem.unanswerable_question_types,
      )
    }
    has_many :chart_items,
             as: :data_source,
             class_name: 'Item::ChartItem'

    after_update :update_test_open_responses_collection, if: :update_test_open_responses_collection?

    scope :not_answerable, -> {
      where(
        question_type: Item::QuestionItem.unanswerable_question_types,
      )
    }

    enum question_type: {
      question_context: 0,
      question_useful: 1,
      question_open: 2,
      question_media: 4,
      question_description: 5,
      question_finish: 6,
      question_clarity: 7,
      question_excitement: 8,
      question_different: 9,
      question_category_satisfaction: 10,
    }

    def self.unanswerable_question_types
      %i[question_media question_description question_finish]
    end

    def requires_roles?
      # NOTE: QuestionItems defer their can_edit access to their parent collection.
      # this is defined in item.rb as to be shared by Questions / FileItems
      false
    end

    private

    def notify_test_design_collection_of_creation?
      parent.is_a?(Collection::TestDesign)
    end

    def notify_test_design_of_creation
      parent.question_item_created(self)
    end

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
