FactoryBot.define do
  factory :survey_response do
    test_collection
    session_uid { SecureRandom.uuid }
    status :in_progress

    trait :fully_answered do
      status :completed
      after(:build) do |survey_response|
        SurveyResponseValidation.new(survey_response).answerable_ids.each do |question_id, idea_id|
          survey_response.question_answers << build(
            :question_answer,
            survey_response: survey_response,
            question_id: question_id,
            idea_id: idea_id,
          )
        end
      end
    end
  end
end
