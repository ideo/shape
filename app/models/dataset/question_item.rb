class Dataset
  class QuestionItem < Dataset

    def data
      data_report.call
    end

    def total
      data_report.total
    end

    def measure
      # The collection name
      question_item.parent&.name
    end

    def question_item
      data_source
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
