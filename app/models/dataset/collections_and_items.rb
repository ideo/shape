class Dataset
  class CollectionsAndItems < Dataset
    # Data source is a collection or item

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

    def data
      # TODO
      {}
    end
  end
end
