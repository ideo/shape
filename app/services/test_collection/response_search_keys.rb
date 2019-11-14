module TestCollection
  class ResponseSearchKeys < SimpleService
    delegate :test_collection, :test_audience_id, to: :@survey_response

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
      @keys.sort
    end

    private

    def add_non_repeating_question_items
      non_repeating_question_items.graphable_questions.each do |question|
        answers_by_question_id[question.id].each do |answer|
          generate_question_answer_keys(question: question, answer: answer)
        end
      end
    end

    def add_idea_question_items
      ideas_question_items.graphable_questions.each do |question|
        idea_items.each do |idea|
          answers_by_question_id[question.id].each do |answer|
            next unless answer.idea_id == idea.id

            generate_question_answer_keys(question: question, answer: answer, idea_id: idea.id)
          end
        end
      end
    end

    def generate_question_answer_keys(question:, answer:, idea_id: nil)
      answer_key_attrs = {
        question: question,
        dont_include_test_answer_wrapper: true,
      }
      # Generate keys without audience
      generate_keys_for_question(
        question: question,
        answer: answer,
        idea_id: idea_id,
        answer_key_attrs: answer_key_attrs,
      )

      # Generate keys with audience
      generate_keys_for_question(
        question: question,
        answer: answer,
        idea_id: idea_id,
        answer_key_attrs: answer_key_attrs.merge(
          audience_id: test_audience_id,
        ),
      )
    end

    def generate_keys_for_question(question:, answer:, idea_id: nil, answer_key_attrs: {})
      if question.question_choices_customizable?
        answer.selected_choice_ids.each do |question_choice_id|
          answer_key = TestCollection::AnswerSearchKey.new(
            answer_key_attrs.merge(question_choice_id: question_choice_id),
          )
          @keys << answer_key.for_test(test_collection.id, idea_id)
          @keys << answer_key.for_organization(organization.id)
        end
      else
        answer_key = TestCollection::AnswerSearchKey.new(
          answer_key_attrs.merge(answer_number: answer.answer_number),
        )
        @keys << answer_key.for_test(test_collection.id, idea_id)
        @keys << answer_key.for_organization(organization.id)
      end
    end

    def answers_by_question_id
      @answers_by_question_id ||= @survey_response.question_answers.each_with_object({}) do |answer, h|
        h[answer.question_id] ||= []
        h[answer.question_id] << answer
      end
    end
  end
end
