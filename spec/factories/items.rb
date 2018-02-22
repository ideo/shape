FactoryBot.define do
  factory :item do
    name { Faker::Food.dish }

    factory :text_item, class: 'Item::TextItem' do
      content { Faker::BackToTheFuture.quote }
    end
  end
end
