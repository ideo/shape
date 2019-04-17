FactoryBot.define do
  factory :question_answer do
    survey_response nil
    question nil
    answer_text "MyText"
    answer_number 1

    trait :unanswered do
      answer_text nil
      answer_number nil
    end
  end
end
