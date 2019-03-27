module DataSource
  class QuestionItem < Base

    private

    def test_collection
      chart_item.parent
    end

    def chart_item
      context[:chart_item]
    end

    def question_item
      context[:question_item]
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
      (1..4).map { |n| { num_responses: 0, answer: n } }
    end

    def grouped_response_data(survey_answers)
      data = base_data
      counts = survey_answers.group(QuestionAnswer.arel_table[:answer_number]).count
      counts.each do |answer_number, count|
        answer_data = data.find { |d| d[:answer] == answer_number }
        begin
          answer_data[:num_responses] = count
        rescue => e
          Appsignal.set_error(e,
                              answer_number: answer_number.to_s,
                              question_item: survey_answers.first.question_id.to_s,
                              counts: counts.map { |p| '%s="%s"' % p }.join(', '))
          next
        end
      end
      data
    end

    def question_data
      # NOTE: the only currently supported data_source is a question_item
      survey_answers = question_item.completed_survey_answers
      {
        label: test_collection.name,
        type: 'question_items',
        total: survey_answers.count,
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
        label: test_collection.organization.name,
        type: 'org_wide',
        total: org_survey_answers.count,
        data: grouped_response_data(org_survey_answers),
      }
    end
  end
end
