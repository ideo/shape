FactoryBot.define do
  factory :survey_response do
    test_collection
    session_uid { SecureRandom.uuid }
    status { :in_progress }
  end
end
