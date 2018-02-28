FactoryBot.define do
  factory :item do
    name { Faker::Food.dish }

    factory :text_item, class: 'Item::TextItem' do
      content { Faker::BackToTheFuture.quote }
      text_data { { ops: [{ insert: 'Hola, world.' }] } }
    end

    factory :video_item, class: 'Item::VideoItem' do
      url { Faker::Internet.url }
      thumbnail_url { Faker::Company.logo }
    end
  end
end
