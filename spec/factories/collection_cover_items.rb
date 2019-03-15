FactoryBot.define do
  factory :collection_cover_item do
    item factory: :text_item
    collection factory: :collection
    order 0
  end
end
