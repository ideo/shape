class Dataset
  class CollectionsAndItems < Dataset
    VALID_MEASURES = %w[
      participants
      viewers
      activity
      content
      collections
      items
      records
    ].freeze

    validates :measure, inclusion: { in: VALID_MEASURES }
    # Data source is a collection or item
    validates :data_source, presence: true

    def data
      return if ever?

      DataReport::CollectionsAndItems.call(
        record: data_source,
        measure: measure,
        timeframe: timeframe,
      )
    end

    def single_value
      return unless ever?

      DataReport::CollectionsAndItems.new(
        record: data_source,
        measure: measure,
        timeframe: timeframe,
      ).single_value
    end
  end
end
