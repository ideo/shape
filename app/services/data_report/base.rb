module DataReport
  class Base < SimpleService
    # 1. measure determines the base query
    # 2. filters add themselves to the query
    # 3. timeframe = within these dates
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
      # To be implemented in child classes
      @data
    end
  end
end
