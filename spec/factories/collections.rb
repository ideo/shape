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
          w = 1
          h = 1
          w = 3 if rand(1..4) == 4
          h = 2 if rand(1..4) == 4
          cc = build(:collection_card_item, parent: collection, order: i, width: w, height: h)
          collection.collection_cards << cc
        end
      end
    end
  end
end
