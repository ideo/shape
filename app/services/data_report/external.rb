module DataReport
  class External < Base
    def call
      calculate
      @data
    end

    private

    def base_query
      NetworkApi::AppMetric
        .where(json_api_query_params)
        .order(measured_at: :asc)
        .per(records_per_page)
    end

    # Include up to 100 records
    def records_per_page
      100
    end

    def json_api_query_params
      params = @filters&.first || {}
      {
        measure: @measure,
        start_date: 3.months.ago,
        # timeframe: @timeframe
      }.merge(params)
    end

    def calculate
      values = base_query.map do |metric|
        {
          date: Date.parse(metric['measured_at']).to_s,
          amount: metric['number'],
        }
      end

      @data[:values] = values
    end
  end
end
