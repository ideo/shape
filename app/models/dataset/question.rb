# == Schema Information
#
# Table name: datasets
#
#  id               :bigint(8)        not null, primary key
#  cached_data      :jsonb
#  chart_type       :integer
#  data_source_type :string
#  description      :text
#  groupings        :jsonb
#  identifier       :string
#  max_domain       :integer
#  measure          :string
#  question_type    :string
#  style            :jsonb
#  timeframe        :integer
#  total            :integer
#  type             :string
#  url              :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  application_id   :integer
#  data_source_id   :bigint(8)
#  organization_id  :bigint(8)
#
# Indexes
#
#  index_datasets_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_datasets_on_organization_id                      (organization_id)
#

class Dataset
  class Question < Dataset
    before_validation :set_default_timeframe
    belongs_to :question_item,
               foreign_key: 'data_source_id',
               class_name: 'Item::QuestionItem',
               optional: true

    DEFAULT_ORG_NAME = 'org-wide-question'.freeze

    def data
      data_report.call
    end

    def total
      data_report.total
    end

    def name
      if grouping.present?
        # Just name off the first grouping for now, change in future
        klass = grouping['type'].constantize
        object = klass.find(grouping['id'].to_i)
        "#{object.name} #{klass.display_name}"
      elsif test_collection_id.present? && test_collection.present?
        test_collection.name.sub(Collection::TestDesign::COLLECTION_SUFFIX, '')
      else
        identifier
      end
    end

    def identifier
      if groupings.blank? && test_collection.present?
        test_collection.name.sub(Collection::TestDesign::COLLECTION_SUFFIX, '')
      else
        self[:identifier]
      end
    end

    def max_domain
      95
    end

    def title
      question_item.question_title
    end

    def description
      question_item.question_description
    end

    def test_collection_id
      test_collection&.id
    end

    def test_collection
      question_item&.parent
    end

    def measure
      :answer_count
    end

    def question_type
      return self[:question_type] if self[:question_type].present?

      question_item&.question_type
    end

    private

    def data_report
      @data_report ||= DataReport::QuestionItem.new(dataset: self)
    end

    def set_default_timeframe
      self.timeframe = :ever
    end

    def org_grouping
      return false if groupings.nil?

      groupings.find { |grouping| grouping['type'] == 'Organization' }
    end

    def test_audience_grouping
      return false if groupings.nil?

      groupings.find { |grouping| grouping['type'] == 'Organization' }
      groupings.find { |grouping| grouping['type'] == 'TestAudience' }
    end
  end
end
