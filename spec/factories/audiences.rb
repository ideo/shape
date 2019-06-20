FactoryBot.define do
  factory :audience do
    name { Faker::Superhero.power }
    price_per_response { rand(1..20) }
    criteria 'MyString'
    age_list []
    children_age_list []
    country_list []
    education_level_list []
    gender_list []
    adopter_type_list []
    interest_list []
    publication_list []

    trait :link_sharing do
      price_per_response 0
    end
  end
end
