FactoryBot.define do
  factory :group do
    organization
    name { Faker::Team.name }
  end
end
