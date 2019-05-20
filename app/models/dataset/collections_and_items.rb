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

    validates :measure, inclusion: { in: Dataset::CollectionsAndItems::VALID_MEASURES }

    def data
      return if ever?

      DataReport::CollectionsAndItems.call(
        dataset: datasets.first,
      )
    end

    def single_value
      return unless ever?

      DataReport::CollectionsAndItems.new(
        dataset: datasets.first,
      ).single_value
    end
  end
end
