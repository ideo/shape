FactoryBot.define do
  factory :question_answer do
    survey_response nil
    question nil
    answer_text "MyText"
    answer_number 1
  end
end
