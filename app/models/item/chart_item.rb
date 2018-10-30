class Item
  class ChartItem < Item
    belongs_to :data_source, polymorphic: true, optional: true

    def base_data
      (1..4).map { |n| { num_responses: 0, answer: n } }
    end

    def grouped_response_data(survey_answers)
      data = base_data
      counts = survey_answers.group(QuestionAnswer.arel_table[:answer_number]).count
      counts.each do |answer_number, count|
        answer_data = data.find { |d| d[:answer] == answer_number }
        answer_data[:num_responses] = count
      end
      data
    end

    def question_data
      # NOTE: the only currently supported data_source is a question_item
      survey_answers = data_source.completed_survey_answers
      {
        label: parent.name,
        type: 'question_items',
        total: survey_answers.count,
        data: grouped_response_data(survey_answers),
      }
    end

    def org_data
      survey_answers = QuestionAnswer
                       .joins(:question)
                       .where(Item::QuestionItem.arel_table[:question_type].eq(data_source.question_type))
                       .joins(survey_response: :test_collection)
                       .where(
                         SurveyResponse.arel_table[:status].eq(:completed),
                       )
                       .where(
                         Collection::TestCollection.arel_table[:organization_id].eq(parent.organization_id),
                       )

      {
        label: parent.organization.name,
        type: 'org_wide',
        total: survey_answers.count,
        data: grouped_response_data(survey_answers),
      }
    end

    def chart_data
      return unless data_source.is_a?(Item::QuestionItem)
      { datasets: [
        question_data,
        org_data,
      ] }
    end
  end
end
