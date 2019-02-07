FactoryBot.define do
  factory :api_token do
    application

    trait :for_organization do
      organization
      application nil
    end
  end
end
