class Item
  class DataItem < Item
    store_accessor :data_settings,
                   :d_measure,
                   :d_filters,
                   :d_timeframe

    validate :data_settings_validations
    VALID_MEASURES = %w[
      participants
      viewers
      activity
    ].freeze
    VALID_TIMEFRAMES = %w[
      ever
      month
      week
    ].freeze

    def report
      DataReport.new(self)
    end

    def data
      report.call
    end

    private

    def data_settings_validations
      unless VALID_MEASURES.include?(d_measure.to_s)
        errors.add(:data_settings, "measure must be one of #{VALID_MEASURES.join(', ')}")
      end
      return if VALID_TIMEFRAMES.include?(d_timeframe.to_s)
      errors.add(:data_settings, "timeframe must be one of #{VALID_TIMEFRAMES.join(', ')}")
    end
  end
end
