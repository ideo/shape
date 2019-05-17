FactoryBot.define do
  factory :dataset do
    timeframe 'month'
    chart_type 'area'

    trait :with_cached_data do
      measure 'Widgets'
      cached_data {
        {
          total: 24,
          chart_type: 'area',
          measure: 'pandas',
          data: [{ value: 24, date: '2018-09-10' }],
        }
      }
    end

    factory :question_item_dataset, class: 'Dataset::QuestionItem' do
      chart_type 'bar'
      data_source factory: :question_item
    end

    factory :org_wide_question_dataset, class: 'Dataset::OrgWideQuestion' do
      question_type :question_clarity
    end

    factory :network_app_metric_dataset, class: 'Dataset::NetworkAppMetric' do
      url 'https://profile.ideo.com/api/v1/app_metrics'
    end
  end
end
