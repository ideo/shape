class ExternalDataReport < SimpleService
  def initialize(data_item)
    @data_item = data_item
    @measure = data_item.d_measure
    @filters = data_item.d_filters
    @timeframe = data_item.d_timeframe
    @data = {
      # e.g. if there was a chart of values...
      values: [],
      value: 0,
    }
  end

  def call
    # base_query
    calculate
    @data
  end

  private

  def base_query
    NetworkApi::AppMetric.
      where(json_api_query_params).
      order(measured_at: :asc)
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
        date: metric['measured_at'],
        amount: metric['number']
      }
    end

    @data[:values] = values
  end
end
