class Dataset
  class OrgWideQuestion < Dataset

    ORG_MEASURE_NAME = 'org-wide-feedback'.freeze

    def data
      data_report.call
    end

    def total
      data_report.total
    end

    def measure
      ORG_MEASURE_NAME
    end

    def max_domain
      95
    end

    private

    def data_report
      @data_report ||= DataReport::QuestionItem.new(dataset: self)
    end
  end
end
