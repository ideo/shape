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
      Item::QuestionItem.scale_answer_numbers.map do |n|
        {
          value: 0,
          column: n,
          percentage: 0,
          search_key: nil,
        }
      end
    end

    private

    def search_key(answer_number: nil, question_choice_id: nil)
      return if answer_number.blank? && question_choice_id.blank?

      answer_key = TestCollection::AnswerSearchKey.new(
        question: question_item,
        question_type: question_type,
        answer_number: answer_number,
        question_choice_id: question_choice_id,
        audience_id: group_by_audience_id,
      )
      if group_by_organization_id.present?
        answer_key.for_organization(group_by_organization_id)
      elsif test_collection.present?
        answer_key.for_test(test_collection.id, group_by_idea_id)
      end
    end

    def question_choice_data
      if question_item.blank?
        if question_type.present? && group_by_organization_id.present?
          org_wide_question_choice_data
        else
          self.class.base_data
        end
      elsif question_choices_customizable?
        customizable_question_choice_data
      else
        scale_question_choice_data
      end
    end

    def org_wide_question_choice_data
      self.class.base_data.map do |d|
        d[:search_key] = search_key(answer_number: d[:column])
        d
      end
    end

    def customizable_question_choice_data
      question_item.question_choices.map do |question_choice|
        {
          value: 0,
          column: question_choice.text,
          percentage: 0,
          id: question_choice.id,
          search_key: search_key(question_choice_id: question_choice.id),
        }
      end
    end

    def scale_question_choice_data
      (1..4).map do |answer_number|
        {
          value: 0,
          column: answer_number,
          percentage: 0,
          search_key: search_key(answer_number: answer_number),
        }
      end
    end

    def question_item
      @dataset.data_source
    end

    def question_type
      question_item&.question_type || @dataset.question_type
    end

    def question_choices_customizable?
      question_item&.question_choices_customizable?
    end

    def grouped_response_data(survey_answers)
      data = question_choice_data
      num_answers = survey_answers.count
      counts = total_answer_count(survey_answers)

      counts.each do |answer_number, count|
        lookup = question_choices_customizable? ? :id : :column
        answer_data = data.find { |d| d[lookup] == answer_number }
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

    def total_answer_count(survey_answers)
      if question_choices_customizable?
        question_item.question_choices.each_with_object({}) do |qc, h|
          total = survey_answers
                  .where('selected_choice_ids @> ?', [qc.id.to_s].to_s)
                  .count
          h[qc.id] = total
        end
      else
        survey_answers.group(QuestionAnswer.arel_table[:answer_number]).count
      end
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

    def group_by_survey_response_id
      group_by_type_id('SurveyResponse')
    end

    def group_by_idea_id
      return @group_by_idea_id unless @group_by_idea_id.nil?

      idea_id = group_by_type_id('Item')

      # Only group by idea if this question is in the ideas section
      # because answers outside of that section aren't tagged with an idea_id
      # so we wouldn't want to scope the dataset on them
      return if idea_id.blank? ||
                !question_item.parent_collection_card.section_type_ideas?

      @group_by_idea_id = idea_id
    end

    def survey_answers
      if group_by_organization_id.present?
        org_survey_answers
      elsif group_by_survey_response_id
        scope_by_idea_id(survey_response_answers)
      elsif group_by_audience_id.present?
        scope_by_idea_id(audience_answers)
      else
        scope_by_idea_id(question_item.completed_survey_answers)
      end
    end

    def survey_response_answers
      question_item.completed_survey_answers
                   .where(
                     SurveyResponse.arel_table[:id].eq(
                       group_by_survey_response_id,
                     ),
                   )
    end

    def audience_answers
      question_item.completed_survey_answers
                   .where(
                     SurveyResponse.arel_table[:test_audience_id].eq(
                       group_by_audience_id,
                     ),
                   )
    end

    def scope_by_idea_id(scope)
      return scope if group_by_idea_id.blank?

      scope.where(idea_id: group_by_idea_id)
    end

    def org_survey_answers
      return QuestionAnswer.none if group_by_organization_id.blank?

      query = QuestionAnswer
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

      return query unless question_item&.question_choices_customizable?

      query.where(
        Item::QuestionItem.arel_table[:id].eq(question_item.id),
      )
    end

    def group_by_type_id(type)
      groupings.find { |g| g['type'] == type }.try(:[], 'id')
    end
  end
end
