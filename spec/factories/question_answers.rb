FactoryBot.define do
  factory :question_answer do
    survey_response
    question nil
    answer_text 'MyText'
    answer_number 1

    after(:build) do |question_answer|
      question = question_answer.question
      if question.question_choices_customizable?
        choice_ids = question.question_choice_ids.sample(2)
        question_answer.answer_number = nil
        if question.question_multiple_choice?
          question_answer.selected_choice_ids = choice_ids
        else
          question_answer.selected_choice_ids = [choice_ids.first]
        end
      end
    end

    trait :unanswered do
      answer_text nil
      answer_number nil
      after(:build) do |question_answer|
        question_answer.selected_choice_ids = []
      end
    end
  end
end
