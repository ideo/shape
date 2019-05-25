module DataReport
  class QuestionItem < SimpleService
    delegate :test_collection, to: :@dataset

    def initialize(dataset:)
      @dataset = dataset
    end

    def call
      grouped_response_data(survey_answers)
    end

    def total
      survey_answers.count
    end

    def self.base_data
      (1..4).map do |n|
        { value: 0, column: n, percentage: 0 }
      end
    end

    private

    def question_item
      @dataset.data_source
    end

    def question_type
      return question_item.question_type if question_item.present?
      @dataset.question_type
    end

    def grouped_response_data(survey_answers)
      data = self.class.base_data
      num_answers = survey_answers.count
      counts = survey_answers.group(QuestionAnswer.arel_table[:answer_number]).count
      counts.each do |answer_number, count|
        answer_data = data.find { |d| d[:column] == answer_number }
        next if answer_data.nil?
        begin
          answer_data[:value] = count
        rescue StandardError => e
          Appsignal.set_error(e,
                              answer_number: answer_number.to_s,
                              question_item: survey_answers.first.question_id.to_s,
                              counts: counts.map { |p| format('%s="%s"', p) }.join(', '))
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
      if @dataset.groupings.present? &&
         @dataset.groupings.first['type'] == 'Organization'
        org_survey_answers
      elsif @dataset.groupings.present? &&
            @dataset.groupings.first['type'] == 'TestAudience'
        question_item.completed_survey_answers
                     .where(
                       SurveyResponse.arel_table[:test_audience_id].eq(
                         @dataset.groupings.first['id'],
                       ),
                     )
      else
        question_item.completed_survey_answers
      end
    end

    def org_survey_answers
      organization_id = @dataset.groupings.first['id']
      QuestionAnswer
        .joins(:question)
        .where(
          Item::QuestionItem.arel_table[:question_type].eq(
            question_type,
          ),
        )
        .joins(survey_response: :test_collection)
        .where(
          SurveyResponse.arel_table[:status].eq(:completed),
        )
        .where(
          Collection::TestCollection.arel_table[:organization_id].eq(
            organization_id,
          ),
        )
    end
  end
end
