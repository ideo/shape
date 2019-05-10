module DataReport
  class QuestionItem < Base

    delegate :question_type, to: :question_item, allow_nil: true

    def call
      datasets
    end

    private

    def test_collection
      @data_item.parent
    end

    def question_item
      @data_item.data_source
    end

    def title
      ''
    end

    def subtitle
      ''
    end

    def datasets
      [
        question_data,
        org_data,
      ]
    end

    def columns
      1.upto(4).map do |i|
        {
          title: i,
        }
      end
    end

    def filters
      []
    end

    def base_data
      (1..4).map { |n| { value: 0, column: n, percentage: 0 } }
    end

    def grouped_response_data(survey_answers)
      data = base_data
      num_answers = survey_answers.count
      counts = survey_answers.group(QuestionAnswer.arel_table[:answer_number]).count
      counts.each do |answer_number, count|
        answer_data = data.find { |d| d[:column] == answer_number }
        begin
          answer_data[:value] = count
        rescue => e
          Appsignal.set_error(e,
                              answer_number: answer_number.to_s,
                              question_item: survey_answers.first.question_id.to_s,
                              counts: counts.map { |p| '%s="%s"' % p }.join(', '))
          next
        end
      end
      add_percentage_to_data(data, num_answers)
    end

    def add_percentage_to_data(data, num_answers)
      data.map do |d|
        d[:percentage] = 0
        if num_answers.positive?
          d[:percentage] = (d[:value].to_f / num_answers * 100).round
        end
        d
      end
    end

    def question_data
      # NOTE: the only currently supported data_source is a question_item
      survey_answers = question_item.completed_survey_answers
      {
        order: 0,
        chart_type: 'bar',
        measure: test_collection.name,
        question_type: question_type,
        total: survey_answers.count,
        timeframe: 'month',
        max_domain: 95,
        data: grouped_response_data(survey_answers),
      }
    end

    def org_survey_answers
      QuestionAnswer
        .joins(:question)
        .where(
          Item::QuestionItem.arel_table[:question_type].eq(
            question_item.question_type,
          ),
        )
        .joins(survey_response: :test_collection)
        .where(
          SurveyResponse.arel_table[:status].eq(:completed),
        )
        .where(
          Collection::TestCollection.arel_table[:organization_id].eq(
            test_collection.organization_id,
          ),
        )
    end

    def org_data
      {
        order: 1,
        chart_type: 'bar',
        measure: "#{test_collection.organization.name} Organization",
        question_type: question_type,
        total: org_survey_answers.count,
        timeframe: 'month',
        max_domain: 95,
        data: grouped_response_data(org_survey_answers),
      }
    end
  end
end
