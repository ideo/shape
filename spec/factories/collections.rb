FactoryBot.define do
  factory :collection do
    name { Faker::Company.buzzword }
    organization
  end
end
