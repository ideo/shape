FactoryBot.define do
  factory :item do
    transient do
      add_editors []
      add_viewers []
    end

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
      url { Faker::Internet.url }
      thumbnail_url { Faker::Company.logo }
    end

    after(:create) do |item, evaluator|
      if evaluator.add_editors.present?
        evaluator.add_editors.each do |user|
          user.add_role(Role::EDITOR, item.becomes(Item))
        end
      end

      if evaluator.add_viewers.present?
        evaluator.add_viewers.each do |user|
          user.add_role(Role::VIEWER, item.becomes(Item))
        end
      end
    end
  end
end
