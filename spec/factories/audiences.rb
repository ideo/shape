FactoryBot.define do
  factory :audience do
    name { Faker::Superhero.power }
    price_per_response { rand(1..20) }
    criteria "MyString"
  end
end
