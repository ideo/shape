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
        dataset: self,
      )
    end

    def single_value
      return unless ever?

      DataReport::CollectionsAndItems.new(
        dataset: self,
      ).single_value
    end
  end
end
