FactoryBot.define do
  factory :collection_card, class: 'CollectionCard::Primary' do
    parent factory: :collection
    order 0
    width 1
    height 1
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
      section_type :ideas
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

    factory :collection_card_placeholder, class: 'CollectionCard::Placeholder'
    factory :collection_card_bct_placeholder, class: 'CollectionCard::Placeholder' do
      parent_snapshot { { collection_cards_attributes: [] } }
    end
  end
end
