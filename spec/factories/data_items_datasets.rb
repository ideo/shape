FactoryBot.define do
  factory :data_items_dataset do
    trait :cached_data do
      dataset factory: %i[dataset with_cached_data]
    end

    trait :question do
      dataset factory: :question_dataset
    end

    trait :network_app_metric do
      dataset factory: :network_app_metric_dataset
    end

    trait :org_wide_question do
      dataset factory: :org_wide_question_dataset
    end

    trait :collections_and_items do
      dataset factory: :collections_and_items_dataset
    end
  end
end
