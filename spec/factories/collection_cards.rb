FactoryBot.define do
  factory :collection_card do
    parent factory: :collection
    width 1
    height 1
    order 0

    factory :collection_card_item do
      item factory: :text_item
      collection nil
    end

    factory :collection_card_collection do
      collection
      item nil
    end
  end
end
