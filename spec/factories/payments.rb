FactoryBot.define do
  factory :payment do
    user
    organization
    amount 99.95
    unit_amount 10
    description { Faker::Hipster.sentence }
    network_payment_method_id { rand(10_000..100_000) }
    purchasable do
      create(:test_audience,
             test_collection: create(:test_collection))
    end
  end
end
