class Dataset
  class Empty < Dataset
    before_validation :set_default_timeframe

    def self.create_for_collection(collection:, chart_type:)
      create(
        cached_data: DataReport::QuestionItem.base_data,
        chart_type: chart_type,
        data_source: collection,
      )
    end

    def total
      0
    end

    def name
      return self[:name] if self[:name].present?
      return if data_source.blank?
      return data_source.name if data_source.is_a?(Collection)
      data_source.parent.name if data_source.is_a?(Item)
    end

    private

    def set_default_timeframe
      self.timeframe = :ever
    end
  end
end
