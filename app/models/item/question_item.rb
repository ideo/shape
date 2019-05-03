class Item
  class QuestionItem < Item
    has_many :question_answers, inverse_of: :question, foreign_key: :question_id, dependent: :destroy
    has_one :test_open_responses_collection, class_name: 'Collection::TestOpenResponses'
    has_one :test_chart_item, class_name: 'Item::ChartItem', as: :data_source

    after_commit :notify_test_design_of_creation,
                 on: :create,
                 if: :notify_test_design_collection_of_creation?

    after_update :update_test_open_responses_collection,
                 if: :update_test_open_responses_collection?

    scope :answerable, -> {
      where.not(
        question_type: unanswerable_question_types,
      )
    }
    has_many :chart_items,
             as: :data_source,
             class_name: 'Item::ChartItem'

    after_update :update_test_open_responses_collection,
                 if: :update_test_open_responses_collection?

    scope :not_answerable, -> {
      where(
        question_type: unanswerable_question_types,
      )
    }

    scope :scale_questions, -> {
      where(
        question_type: question_type_categories[:scaled_rating],
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

    def self.question_type_categories
      {
        idea_content: %i[
          question_description
          question_media
        ],
        scaled_rating: %i[
          question_context
          question_useful
          question_excitement
          question_different
          question_clarity
          question_category_satisfaction
        ],
        customizable: %i[
          question_category_satisfaction
          question_context
          question_open
        ],
      }
    end

    def self.unanswerable_question_types
      %i[question_media question_description question_finish]
    end

    def scale_question?
      self.class.question_type_categories[:scaled_rating].include?(question_type&.to_sym)
    end

    def requires_roles?
      # NOTE: QuestionItems defer their can_edit access to their parent collection.
      # this is defined in item.rb as to be shared by Questions / FileItems
      false
    end

    def completed_survey_answers
      question_answers
        .joins(:survey_response)
        .where(
          SurveyResponse.arel_table[:status].eq(:completed),
        )
    end

    def score
      return unless scale_question?
      # answers are 1-4, but scored on a scale of 0-3
      # TODO: change the answer_numbers on the emojiScale to go 0-3 to match? (would need to migrate old answers)
      points = completed_survey_answers.sum('answer_number - 1') || 0
      total = completed_survey_answers.count * 3
      # don't want to divide by 0
      return 0 if total.zero?
      (points * 100.0 / total).round
    end

    def create_response_graph(parent_collection:, initiated_by:)
      return if !scale_question? || test_chart_item.present?

      builder = CollectionCardBuilder.new(
        params: {
          order: parent_collection_card.order,
          height: 2,
          width: 2,
          item_attributes: {
            type: 'Item::ChartItem',
            data_source: self,
          },
        },
        parent_collection: parent_collection,
        user: initiated_by,
      )
      builder.create
      builder.collection_card
    end

    def create_open_response_collection(parent_collection:, initiated_by:)
      return if !question_open? || test_open_responses_collection.present?

      builder = CollectionCardBuilder.new(
        params: {
          order: parent_collection_card.order,
          collection_attributes: {
            name: "#{content} Responses",
            type: 'Collection::TestOpenResponses',
            question_item_id: id,
          },
        },
        parent_collection: parent_collection,
        user: initiated_by,
      )
      builder.create
      builder.collection_card
    end

    private

    def notify_test_design_collection_of_creation?
      parent.is_a?(Collection::TestDesign)
    end

    def notify_test_design_of_creation
      parent.question_item_created(self)
    end

    def update_test_open_responses_collection?
      saved_change_to_content? && test_open_responses_collection.present?
    end

    def update_test_open_responses_collection
      test_open_responses_collection.update(
        name: "#{content} Responses",
      )
    end
  end
end
