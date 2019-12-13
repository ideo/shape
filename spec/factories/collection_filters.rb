FactoryBot.define do
  factory :collection_filter do
    collection
    text { Faker::Color.color_name }
    filter_type :search
  end
end
