FactoryBot.define do
  factory :dataset do
    timeframe 'month'
    chart_type 'area'
    identifier 'report'

    trait :with_cached_data do
      measure 'Widgets'
      cached_data do
        [{ value: 24, date: '2018-09-10' }]
      end
    end

    factory :collections_and_items_dataset, class: 'Dataset::CollectionsAndItems' do
      chart_type 'area'
      data_source factory: :collection
      measure 'participants'
      timeframe 'month'
    end

    factory :question_dataset, class: 'Dataset::Question' do
      chart_type 'bar'
      data_source factory: :question_item
      groupings { [] }
    end

    factory :org_wide_question_dataset, class: 'Dataset::Question' do
      question_type :question_clarity
    end

    factory :network_app_metric_dataset, class: 'Dataset::NetworkAppMetric' do
      url 'https://profile.ideo.com/api/v1/app_metrics'
    end

    factory :empty_dataset, class: 'Dataset::Empty' do
      data_source factory: :test_collection
    end
  end
end
