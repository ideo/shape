module DataReport
  class QuestionItem < SimpleService

    ORG_MEASURE_NAME = 'org-wide-feedback'.freeze

    def initialize(dataset:)
      @dataset = dataset
    end

    def call
      return grouped_response_data(survey_answers) if question_item?

      grouped_response_data(org_survey_answers)
    end

    def total
      return survey_answers.count if question_item?

      org_survey_answers.count
    end

    private

    def question_item?
      @dataset.is_a?(Dataset::QuestionItem)
    end

    def org_wide?
      @dataset.is_a?(Dataset::OrgWideQuestion)
    end

    def test_collection
      @dataset.parent
    end

    def question_item
      @dataset.data_source
    end

    def question_type
      return question_item.question_type if question_item.present?
      @dataset.question_type
    end

    def base_data
      (1..4).map do |n|
        { value: 0, column: n, percentage: 0 }
      end
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

    def survey_answers
      question_item.completed_survey_answers
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
  end
end
