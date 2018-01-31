FactoryBot.define do
  factory :collection do
    name { Faker::Company.buzzword }
    # association :cloned_from, factory: :collection
  end
end
