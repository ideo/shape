class Dataset
  class OrgWideQuestion < Dataset
    before_validation :set_default_timeframe

    def self.setup_new_question_type(question_type)
      Organization.find_each do |organization|
        where(
          organization: organization,
          question_type: question_type,
        ).find_or_create
      end
    end

    def self.find_or_create_for_organization(organization)
      Item::QuestionItem
        .question_type_categories[:scaled_rating]
        .each do |question_type|

        where(
          organization: organization,
          question_type: question_type,
        ).find_or_create
      end
    end

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
