FactoryBot.define do
  factory :comment do
    author
    message { Faker::Simpsons.quote }
  end
end
