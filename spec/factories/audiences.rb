FactoryBot.define do
  factory :audience do
    name { Faker::Superhero.power }
    price_per_response { rand(1..20) }
    criteria 'MyString'

    trait :link_sharing do
      price_per_response 0
    end
  end
end
