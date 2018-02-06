FactoryBot.define do
  factory :collection do
    transient do
      num_cards 0
    end

    name { Faker::Company.buzzword }
    organization

    trait :subcollection do
      organization nil
    end

    after(:build) do |collection, evaluator|
      if evaluator.num_cards > 0
        1.upto(evaluator.num_cards) do |i|
          cc = build(:collection_card_item, parent: collection, order: i)
          collection.collection_cards << cc
        end
      end
    end
  end
end
