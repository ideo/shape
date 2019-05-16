class Dataset
  class OrgWideQuestion < Dataset
    before_validation :set_default_timeframe

    def data
      data_report.call
    end

    def total
      data_report.total
    end

    def measure
      "#{organization&.name} Organization"
    end

    def max_domain
      95
    end

    private

    def data_report
      @data_report ||= DataReport::QuestionItem.new(dataset: self)
    end

    def set_default_timeframe
      self.timeframe = :ever
    end
  end
end
