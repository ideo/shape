module DataReport
  class Base < SimpleService
    # 1. measure determines the base query
    # 2. filters add themselves to the query
    # 3. timeframe = within these dates
    def initialize(data_item, override_measures:, show_users: false)
      @data_item = data_item
      @measure = override_measures[:d_measure] || data_item.d_measure
      @filters = override_measures[:d_filters] || data_item.d_filters
      @timeframe = override_measures[:d_timeframe] || data_item.d_timeframe
      @show_users = show_users
      @data = {
        # e.g. if there was a chart of values...
        values: [],
        value: 0,
      }
    end

    def call
      # To be implemented in child classes
      @data
    end
  end
end
