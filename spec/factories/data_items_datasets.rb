FactoryBot.define do
  factory :data_items_dataset do
    trait :cached_data do
      dataset factory: [:dataset, :with_cached_data]
    end

    trait :question_item do
      dataset factory: :question_item_dataset
    end

    trait :network_app_metric do
      dataset factory: :network_app_metric_dataset
    end

    trait :org_wide_question do
      dataset factory: :org_wide_question_dataset
    end
  end
end
