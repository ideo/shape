module DataReport
  class NetworkAppMetric < Base
    def call
      datasets
    end

    private

    def datasets
      [
        {
          measure: @measure,
          chart_type: 'area',
          timeframe: 'month',
          primary: true,
          data: data,
        },
      ]
    end

    def data
      @data ||= base_query.map do |metric|
        {
          date: Date.parse(metric['measured_at']).to_s,
          value: metric['number'],
        }
      end
    end

    def base_query
      NetworkApi::AppMetric
        .where(json_api_query_params)
        .order(measured_at: :asc)
        .per(records_per_page)
    end

    def json_api_query_params
      params = @filters&.first || {}
      {
        measure: @measure,
        start_date: 3.months.ago,
        # timeframe: @timeframe
      }.merge(params)
    end

    # Include up to 100 records
    def records_per_page
      100
    end
  end
end
