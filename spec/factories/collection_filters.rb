FactoryBot.define do
  factory :collection_filter do
    text { Faker::Color.color_name }
    filter_type :search
    collection factory: :collection
  end
end
