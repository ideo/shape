class Item
  class ChartItem < Item
    belongs_to :data_source, polymorphic: true, optional: true

    def chart_data
      return unless data_source.is_a?(Item::QuestionItem)
      data = {}
      data_source
        .question_answers
        .joins(:survey_response)
        .where(
          SurveyResponse.arel_table[:status].eq(:completed),
        ).each do |answer|
        unless data.key?(answer.answer_number)
          data[answer.answer_number] = 0
        end
        data[answer.answer_number] += 1
      end
      data
    end

    private

    def cache_attributes
      if cached_chart_data != chart_data
        self.cached_chart_data = chart_data
      end
      cached_attributes
    end
  end
end
