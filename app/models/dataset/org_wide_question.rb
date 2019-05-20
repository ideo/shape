class Dataset
  class OrgWideQuestion < Dataset
    before_validation :set_default_timeframe_and_name

    DEFAULT_NAME = 'org-wide-question'.freeze

    def data
      data_report.call
    end

    def total
      data_report.total
    end

    def display_name
      "#{organization&.name} Organization"
    end

    def max_domain
      95
    end

    def measure
      :answer_count
    end

    private

    def data_report
      @data_report ||= DataReport::QuestionItem.new(dataset: self)
    end

    def set_default_timeframe_and_name
      self.timeframe ||= :ever
      self.name ||= DEFAULT_NAME
    end
  end
end
