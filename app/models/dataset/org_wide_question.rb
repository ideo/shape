# == Schema Information
#
# Table name: datasets
#
#  id               :bigint(8)        not null, primary key
#  cached_data      :jsonb
#  chart_type       :integer
#  data_source_type :string
#  description      :text
#  max_domain       :integer
#  measure          :string
#  name             :string
#  question_type    :string
#  style            :jsonb
#  timeframe        :integer
#  total            :integer
#  type             :string
#  url              :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  data_source_id   :bigint(8)
#  organization_id  :bigint(8)
#
# Indexes
#
#  index_datasets_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_datasets_on_organization_id                      (organization_id)
#

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
