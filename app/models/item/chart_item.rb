class Item
  class ChartItem < Item
    belongs_to :data_source, polymorphic: true, optional: true

    def chart_data
      return unless data_source.is_a?(Item::QuestionItem)
      data = {}
      completed_answers = data_source.question_answers
                 .select(&:survey_response_completed?)

      completed_answers.each do |answer|
        if !data.key?(answer.answer_number)
          data[answer.answer_number] = 0
        end
        data[answer.answer_number] += 1
      end
      data
    end
  end
end
