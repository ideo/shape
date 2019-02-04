FactoryBot.define do
  factory :application do
    name { Faker::Company.buzzword }
  end
end
