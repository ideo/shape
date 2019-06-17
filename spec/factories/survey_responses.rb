FactoryBot.define do
  factory :survey_response do
    test_collection
    session_uid { SecureRandom.uuid }
    status :in_progress

    trait :fully_answered do
      after(:build) do |survey_response|
        survey_response.test_collection.question_items.answerable.each do |question_item|
          survey_response.question_answers << build(
            :question_answer,
            survey_response: survey_response,
            question: question_item,
          )
        end
      end
    end
  end
end
