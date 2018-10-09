class Item
  class ChartItem < Item
    belongs_to :data_source, polymorphic: true, optional: true

    def base_data
      (1..4).map { |n| { num_responses: 0, answer: n } }
    end

    def question_data
      survey_answers = data_source
                       .question_answers
                       .joins(:survey_response)
                       .where(
                         SurveyResponse.arel_table[:status].eq(:completed),
                       )

      data = base_data
      survey_answers.each do |answer|
        answer_data = data.find { |d| d[:answer] == answer.answer_number }
        answer_data[:num_responses] += 1
      end
      {
        label: parent.name,
        type: 'question_items',
        total: survey_answers.count,
        data: data,
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
      data = base_data
      survey_answers.each do |answer|
        answer_data = data.find { |d| d[:answer] == answer.answer_number }
        answer_data[:num_responses] += 1
      end
      {
        label: parent.organization.name,
        type: 'org_wide',
        total: survey_answers.count,
        data: data,
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
