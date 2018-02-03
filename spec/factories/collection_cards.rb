FactoryBot.define do
  factory :collection_card do
    collection
    linkable factory: :item
    width 1
    height 1
    order 0

    trait :to_collection do
      linkable factory: :collection
    end
  end
end
