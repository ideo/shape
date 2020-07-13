FactoryBot.define do
  factory :audience do
    name { Faker::Superhero.power }
    # Need to set a minimum or else our price will be below a valid amount
    min_price_per_response { Audience::TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE }
    age_list []
    children_age_list []
    country_list []
    education_level_list []
    gender_list []
    adopter_type_list []
    interest_list []
    publication_list []

    trait :link_sharing do
      min_price_per_response 0
      global_default 1
    end

    trait :challenge do
      min_price_per_response 0
      global_default 1
      audience_type 0
    end
  end
end
