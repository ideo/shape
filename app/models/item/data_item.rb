class Item
  class DataItem < Item
    store_accessor :data_settings,
                   :d_measure,
                   :d_filters,
                   :d_timeframe

    def report
      url.present? ? external_report : internal_report
    end

    def data
      report.call
    end

    private

    def internal_report
      DataReport.new(self)
    end

    def external_report
      ExternalDataReport.new(self)
    end
  end
end
