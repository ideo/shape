FactoryBot.define do
  factory :collection_card, class: 'CollectionCard::Primary' do
    parent factory: :collection
    order 0
    sequence(:row)
    sequence(:col)

    factory :collection_card_image do
      item factory: :file_item, strategy: :build
      collection nil
    end

    factory :collection_card_pdf do
      item factory: :pdf_file_item, strategy: :build
      collection nil
    end

    factory :collection_card_video do
      item factory: :video_item, strategy: :build
      collection nil
    end

    factory :collection_card_text do
      item factory: :text_item, strategy: :build
      collection nil
    end

    factory :collection_card_question do
      item factory: :question_item
      collection nil
    end

    factory :collection_card_collection do
      collection factory: :collection, strategy: :build
      item nil
    end

    factory :collection_card_link, class: 'CollectionCard::Link' do
      factory :collection_card_link_image do
        item factory: :file_item, strategy: :build
        collection nil
      end

      factory :collection_card_link_video do
        item factory: :video_item, strategy: :build
        collection nil
      end

      factory :collection_card_link_text do
        item factory: :text_item, strategy: :build
        collection nil
      end

      factory :collection_card_link_collection do
        collection
        item nil
      end
    end
  end
end
