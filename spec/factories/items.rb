FactoryBot.define do
  factory :item do
    name { Faker::Food.dish }

    factory :text_item, class: 'Item::TextItem' do
      content { Faker::BackToTheFuture.quote }
      text_data { { ops: [{ insert: 'Hola, world.' }] } }
    end

    factory :image_item, class: 'Item::ImageItem' do
      filestack_file
    end

    factory :video_item, class: 'Item::VideoItem' do
      url 'https://www.youtube.com/watch?v=igJ4qADrSwo'
    end
  end
end
