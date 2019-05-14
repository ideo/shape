class Dataset
  class OrgWideQuestion < Dataset

    ORG_MEASURE_NAME = 'org-wide-feedback'.freeze

    def data
      data_report.call
    end

    def total
      data_report.total
    end

    def measure(organization = nil)
      organization ||= data_items.first&.organization
      "#{organization&.name} Organization"
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
