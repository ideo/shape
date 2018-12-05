class Item
  class DataItem < Item
    store_accessor :data_settings,
                   :d_measure,
                   :d_filters,
                   :d_timeframe

    def report
      DataReport.new(self)
    end

    def data
      report.call
    end
  end
end
