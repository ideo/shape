module DataReport
  class QuestionItem < SimpleService
    delegate :test_collection, :groupings, to: :@dataset

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
        {
          value: 0,
          column: n,
          percentage: 0,
          search_key: search_key(n),
        }
      end
    end

    private

    def search_key(answer_number)
      answer = QuestionAnswer.new(
        question: question_item,
        answer_number: answer_number,
      )
      answer_key = TestCollection::AnswerSearchKey.new(
        answer, group_by_audience_id
      )
      if group_by_organization_id.present?
        answer_key.for_organization(group_by_organization_id)
      else
        # TODO: need to be able to get the Idea ID
        idea_id = nil
        answer_key.for_test(test_collection.id, idea_id)
      end
    end

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

    def group_by_audience_id
      group_by_type_id('TestAudience')
    end

    def group_by_organization_id
      group_by_type_id('Organization')
    end

    def group_by_idea_id
      group_by_type_id('Organization')
    end

    def group_by_type_id(type)
      groupings.find { |g| g['type'] == type }.try(:[], 'id')
    end

    def survey_answers
      if group_by_organization_id.present?
        org_survey_answers
      elsif group_by_audience_id.present?
        question_item.completed_survey_answers
                     .where(
                       SurveyResponse.arel_table[:test_audience_id].eq(
                         group_by_audience_id,
                       ),
                     )
      else
        question_item.completed_survey_answers
      end
    end

    def org_survey_answers
      return QuestionAnswer.none if group_by_organization_id.blank?

      QuestionAnswer
        .joins(
          :question,
          survey_response: :test_collection,
        )
        .where(
          Item::QuestionItem.arel_table[:question_type].eq(
            question_type,
          ).and(
            SurveyResponse.arel_table[:status].eq(:completed),
          ).and(
            Collection::TestCollection.arel_table[:organization_id].eq(
              group_by_organization_id,
            ),
          ),
        )
    end
  end
end
