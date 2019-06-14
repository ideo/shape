FactoryBot.define do
  factory :test_audience do
    sample_size 1
    audience
    test_collection nil
    launched_by factory: :user

    trait :payment do
      after(:build) do |test_audience|
        test_audience.price_per_response ||= 4.50
        payment = build(
          :payment,
          :paid,
          purchasable: test_audience,
          amount: test_audience.total_price,
          description: test_audience.description,
        )
        test_audience.payment = payment
      end
    end

    trait :link_sharing do
      audience factory: [:audience, :link_sharing]
    end
  end
end
