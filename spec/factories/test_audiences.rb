FactoryBot.define do
  factory :test_audience do
    sample_size 5
    audience
    test_collection nil
    launched_by factory: :user
    # Need to set a minimum or else our price will be below a valid amount
    price_per_response { audience.price_per_response(10) || Audience::TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE }

    trait :payment do
      after(:build) do |test_audience|
        payment = build(
          :payment,
          :paid,
          purchasable: test_audience,
          amount: test_audience.price_per_response * test_audience.sample_size,
          description: test_audience.description,
        )
        test_audience.payment = payment
      end
    end

    trait :link_sharing do
      audience factory: %i[audience link_sharing]
    end

    trait :reviewers do
      audience factory: %i[audience challenge]
      after(:create) do |test_audience|
        test_audience.audience.update(name: 'Reviewers')
      end
    end
  end
end
