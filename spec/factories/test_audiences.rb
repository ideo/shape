FactoryBot.define do
  factory :test_audience do
    sample_size 1
    audience
    test_collection nil
    launched_by factory: :user

    trait :payment do
      after(:build) do |test_audience|
        payment = build(:payment, :paid, purchasable: test_audience, amount: test_audience.price_per_response * test_audience.sample_size)
        test_audience.payment = payment
      end
    end

    trait :link_sharing do
      audience factory: %i[audience link_sharing]
    end
  end
end
