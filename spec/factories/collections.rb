FactoryBot.define do
  factory :collection do
    transient do
      num_cards 0
    end

    name { Faker::Company.buzzword }
    organization

    after(:build) do |collection, evaluator|
      if evaluator.num_cards > 0
        1.upto(evaluator.num_cards) do
          cc = build(:collection_card, collection: collection)
          collection.collection_cards << cc
        end
      end
    end
  end
end
