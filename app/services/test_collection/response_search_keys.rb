module TestCollection
  class ResponseSearchKeys < BaseService
    delegate :test_collection, :test_audience, to: :@survey_response

    delegate :non_repeating_question_items, :ideas_question_items, :idea_items,
             :organization,
             to: :test_collection

    def initialize(survey_response:)
      @survey_response = survey_response
      @keys = []
    end

    def call
      add_non_repeating_question_items
      add_idea_question_items
      @keys
    end

    private

    def add_non_repeating_question_items
      non_repeating_question_items.select(&:question_graphable?).each do |question|
        answers_by_question_id[question.id].each do |answer|
          answer_key = TestCollection::AnswerSearchKey.new(answer)
          @keys << answer_key.for_test(test_id)
          @keys << answer_key.for_organization(organization.id)
        end
      end
    end

    def add_idea_question_items
      ideas_question_items.select(&:question_graphable?).each do |question|
        idea_items.each do |idea|
          answers_by_question_id[question.id].each do |answer|
            next unless answer.idea_id == idea.id

            answer_key = TestCollection::AnswerSearchKey.new(answer)
            @keys << answer_key.for_test(test_id, idea_id)
            @keys << answer_key.for_organization(organization.id)
          end
        end
      end
    end

    def answers_by_question_id
      @answers_by_question_id ||= survey_response.question_answers.each_with_object({}) do |answer, h|
        h[answer.question_id] ||= []
        h[answer.question_id] << answer
      end
    end
  end
end
